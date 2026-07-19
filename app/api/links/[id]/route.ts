import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { validatePlatformUrl, detectPlatform, slugifyPlatform, isKnownPlatform, type Platform } from "@/lib/platforms";
import { PLATFORMS } from "@/lib/constants";
import { validateUrlBackend } from "@/lib/urlValidation";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { checkRateLimit } from "@/lib/rateLimit";

const LINK_MUTATE_LIMIT = 20;
const LINK_MUTATE_WINDOW_MS = 60 * 1000; // 20 updates/deletes per minute per user

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(
    `link-mutate:${session.user.email}`,
    LINK_MUTATE_LIMIT,
    LINK_MUTATE_WINDOW_MS
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { id } = await context.params;
  const body = await req.json();
  const url = body?.url;
  const isPublic = body?.isPublic;
  const label = body?.label;
  const platform = body?.platform;

  const rawExplicitPlatform = typeof platform === "string" ? platform.trim() : null;
  const explicitPlatform = rawExplicitPlatform && Object.keys(PLATFORM_ICONS).includes(rawExplicitPlatform)
    ? rawExplicitPlatform as Platform
    : null;

  const link = await prisma.link.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!link || link.user.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: { url?: string; isPublic?: boolean; label?: string; platform?: string } = {};

  const activeLabel = typeof label === "string" ? label.trim() : link.label;

  if (typeof label === "string") {
    if (!activeLabel) {
      return NextResponse.json(
        { error: "Please enter a name for this link" },
        { status: 400 }
      );
    }
    data.label = activeLabel;
  }

  if (typeof url === "string") {
    const validation = validateUrlBackend(url);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const finalUrl = validation.normalizedUrl;

    const platformForValidation = explicitPlatform || (isKnownPlatform(link.platform) ? link.platform : detectPlatform(finalUrl));

    if (!validatePlatformUrl(platformForValidation, finalUrl)) {
      return NextResponse.json(
        { error: "Please enter a valid public link" },
        { status: 400 },
      );
    }

    data.url = finalUrl;
  }

  if (typeof url === "string" || typeof label === "string" || platform !== undefined) {
    const finalUrlForPlatform = data.url || link.url || "";
    const detectedPlatform = explicitPlatform || detectPlatform(finalUrlForPlatform);
    let finalPlatform: string;

    if (detectedPlatform === PLATFORMS.WEBSITE) {
      finalPlatform = slugifyPlatform(activeLabel);

      if (!finalPlatform) {
        return NextResponse.json(
          { error: "Please enter a valid alphanumeric name for this link" },
          { status: 400 }
        );
      }
    } else {
      finalPlatform = detectedPlatform;
    }

    if (finalPlatform !== link.platform) {
      data.platform = finalPlatform;
    }
  }

  if (typeof isPublic === "boolean") {
    data.isPublic = isPublic;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updatedLink = await prisma.$transaction(async (tx) => {
        // Enforce uniqueness for the resulting route if platform is changing
        if (data.platform) {
            const proposedRoute = link.alias || data.platform;
            const existingLink = await tx.link.findFirst({
                where: {
                    userId: link.userId,
                    id: { not: link.id },
                    OR: [
                        { alias: proposedRoute },
                        { platform: proposedRoute, alias: null }
                    ]
                }
            });

            if (existingLink) {
                throw Object.assign(new Error("ROUTE_ALREADY_EXISTS"), { code: "ROUTE_ALREADY_EXISTS", proposedRoute });
            }
        }

        return tx.link.update({
            where: { id },
            data,
        });
    });

    return NextResponse.json({ success: true, link: updatedLink });
  } catch (err: unknown) {
    const error = err as { code?: string; proposedRoute?: string };
    
    if (error?.code === "ROUTE_ALREADY_EXISTS") {
        return NextResponse.json(
            { error: `The route '/${error.proposedRoute}' is already in use.` },
            { status: 409 }
        );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const labelForErrorMessage = (typeof label === "string" ? label.trim() : link.label) || "custom link";
      return NextResponse.json(
        { error: `You already added your ${labelForErrorMessage} link.` },
        { status: 409 }
      );
    }
    console.error("Link update error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(
    `link-mutate:${session.user.email}`,
    LINK_MUTATE_LIMIT,
    LINK_MUTATE_WINDOW_MS
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { id } = await context.params;

  const link = await prisma.link.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!link || link.user.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.link.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}


