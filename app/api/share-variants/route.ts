// app/api/share-variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma  from "@/lib/prisma";
import { isValidSlug } from "@/lib/url";

// ── GET /api/share-variants ───────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const variants = await prisma.shareVariant.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(variants);
}

// ── POST /api/share-variants ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { slug, title, description, linkIds, accentColor, logo, backgroundColor, isPublic, backgroundImage, customCss } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "slug must be 2–40 lowercase letters, numbers, or hyphens" },
        { status: 400 }
      );
    }

    const existing = await prisma.shareVariant.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    });
    if (existing) {
      return NextResponse.json({ error: "A variant with this slug already exists" }, { status: 409 });
    }

    const variant = await prisma.shareVariant.create({
      data: {
        userId: user.id,
        slug,
        title,
        description: description ?? null,
        linkIds: linkIds ?? [],
        accentColor: accentColor ?? "#6366f1",
        logo: logo ?? null,
        backgroundColor: backgroundColor ?? null,
        backgroundImage: backgroundImage ?? null,
        customCss: customCss ?? null,
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (err: unknown) {
    // Return a JSON error with diagnostic info in development to aid debugging
    const message = err instanceof Error ? err.message : String(err);
    // Log full error server-side for tracing
    console.error("Error in POST /api/share-variants:", err);

    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { error: isDev ? message : "Internal server error" },
      { status: 500 }
    );
  }
}