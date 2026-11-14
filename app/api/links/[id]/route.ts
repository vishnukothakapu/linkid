import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractClientIp, runWithAuditContext } from "@/lib/event-bus";

function isValidHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.link.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.url !== undefined) {
      if (typeof body.url !== "string" || !isValidHttpUrl(body.url.trim())) {
        return NextResponse.json(
          { error: "A valid HTTP or HTTPS URL is required" },
          { status: 400 }
        );
      }
    }

    return await runWithAuditContext(
      {
        actorId: session.user.id,
        ipAddress: extractClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      async () => {
        const updated = await prisma.link.update({
          where: { id },
          data: {
            ...(typeof body.title === "string"
              ? { title: body.title.trim() }
              : {}),
            ...(typeof body.url === "string" ? { url: body.url.trim() } : {}),
            ...(body.platform !== undefined
              ? {
                  platform:
                    typeof body.platform === "string" && body.platform.trim()
                      ? body.platform.trim()
                      : null,
                }
              : {}),
            ...(typeof body.isVisible === "boolean"
              ? { isVisible: body.isVisible }
              : {}),
            ...(typeof body.order === "number" ? { order: body.order } : {}),
          },
        });

        return NextResponse.json({ link: updated }, { status: 200 });
      }
    );
  } catch (error) {
    console.error("[PATCH /api/links/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.link.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return await runWithAuditContext(
      {
        actorId: session.user.id,
        ipAddress: extractClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      async () => {
        await prisma.link.delete({
          where: { id },
        });

        return NextResponse.json(
          { message: "Link deleted successfully" },
          { status: 200 }
        );
      }
    );
  } catch (error) {
    console.error("[DELETE /api/links/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}