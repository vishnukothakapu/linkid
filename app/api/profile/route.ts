import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractClientIp, runWithAuditContext } from "@/lib/event-bus";

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

function isValidHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        headline: true,
        bio: true,
        location: true,
        website: true,
        image: true,
        theme: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length > 80) {
        return NextResponse.json(
          { error: "Name must be 80 characters or fewer" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.username !== undefined) {
      const normalized =
        typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "";
      if (!USERNAME_REGEX.test(normalized)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, or underscores",
          },
          { status: 400 }
        );
      }

      const taken = await prisma.user.findFirst({
        where: {
          username: normalized,
          NOT: { id: session.user.id },
        },
        select: { id: true },
      });

      if (taken) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }

      updateData.username = normalized;
    }

    if (body.headline !== undefined) {
      updateData.headline =
        typeof body.headline === "string" ? body.headline.trim() || null : null;
    }

    if (body.bio !== undefined) {
      if (typeof body.bio === "string" && body.bio.length > 500) {
        return NextResponse.json(
          { error: "Bio must be 500 characters or fewer" },
          { status: 400 }
        );
      }
      updateData.bio =
        typeof body.bio === "string" ? body.bio.trim() || null : null;
    }

    if (body.location !== undefined) {
      updateData.location =
        typeof body.location === "string" ? body.location.trim() || null : null;
    }

    if (body.website !== undefined) {
      const trimmedWebsite =
        typeof body.website === "string" ? body.website.trim() : "";
      if (trimmedWebsite && !isValidHttpUrl(trimmedWebsite)) {
        return NextResponse.json(
          { error: "Website must be a valid HTTP or HTTPS URL" },
          { status: 400 }
        );
      }
      updateData.website = trimmedWebsite || null;
    }

    if (body.theme !== undefined && typeof body.theme === "string") {
      updateData.theme = body.theme.trim();
    }

    if (Array.isArray(body.skills)) {
      updateData.skills = body.skills
        .filter((s: unknown): s is string => typeof s === "string")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    return await runWithAuditContext(
      {
        actorId: session.user.id,
        ipAddress: extractClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      async () => {
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            headline: true,
            bio: true,
            location: true,
            website: true,
            image: true,
            theme: true,
            skills: true,
          },
        });

        return NextResponse.json({ user: updatedUser }, { status: 200 });
      }
    );
  } catch (error) {
    console.error("[PATCH /api/profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await runWithAuditContext(
      {
        actorId: session.user.id,
        ipAddress: extractClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      async () => {
        await prisma.user.delete({
          where: { id: session.user.id },
        });

        return NextResponse.json(
          { message: "Account deleted successfully" },
          { status: 200 }
        );
      }
    );
  } catch (error) {
    console.error("[DELETE /api/profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}