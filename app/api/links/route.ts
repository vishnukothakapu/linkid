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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.link.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ links }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/links] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const platform =
      typeof body.platform === "string" && body.platform.trim()
        ? body.platform.trim()
        : null;
    const isVisible =
      typeof body.isVisible === "boolean" ? body.isVisible : true;

    if (!title) {
      return NextResponse.json(
        { error: "Link title is required" },
        { status: 400 }
      );
    }

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: "A valid HTTP or HTTPS URL is required" },
        { status: 400 }
      );
    }

    return await runWithAuditContext(
      {
        actorId: session.user.id,
        ipAddress: extractClientIp(req),
        userAgent: req.headers.get("user-agent"),
      },
      async () => {
        const lastLink = await prisma.link.findFirst({
          where: { userId: session.user.id },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        const nextOrder =
          typeof body.order === "number"
            ? body.order
            : (lastLink?.order ?? -1) + 1;

        const createdLink = await prisma.link.create({
          data: {
            title,
            url,
            platform,
            isVisible,
            order: nextOrder,
            userId: session.user.id,
          },
        });

        return NextResponse.json({ link: createdLink }, { status: 201 });
      }
    );
  } catch (error) {
    console.error("[POST /api/links] Error:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
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

    if (Array.isArray(body.links)) {
      return await runWithAuditContext(
        {
          actorId: session.user.id,
          ipAddress: extractClientIp(req),
          userAgent: req.headers.get("user-agent"),
        },
        async () => {
          const updates = body.links
            .filter(
              (item: unknown): item is { id: string; order: number } =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as { id?: unknown }).id === "string" &&
                typeof (item as { order?: unknown }).order === "number"
            )
            .map((item: { id: string; order: number }) =>
              prisma.link.update({
                where: {
                  id: item.id,
                  userId: session.user.id,
                },
                data: { order: item.order },
              })
            );

          const updatedLinks = await Promise.all(updates);
          return NextResponse.json({ links: updatedLinks }, { status: 200 });
        }
      );
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.link.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

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
        const updatedLink = await prisma.link.update({
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

        return NextResponse.json({ link: updatedLink }, { status: 200 });
      }
    );
  } catch (error) {
    console.error("[PATCH /api/links] Error:", error);
    return NextResponse.json(
      { error: "Failed to update link" },
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Link ID query parameter is required" },
        { status: 400 }
      );
    }

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
    console.error("[DELETE /api/links] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}