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

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "slug must be 2–40 lowercase letters, numbers, or hyphens" },
        { status: 400 }
      );
    }

    // Validate title is string
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
    }

    // Validate optional string fields
    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json({ error: "description must be a string" }, { status: 400 });
    }

    if (logo !== undefined && typeof logo !== "string") {
      return NextResponse.json({ error: "logo must be a string" }, { status: 400 });
    }

    if (backgroundImage !== undefined && typeof backgroundImage !== "string") {
      return NextResponse.json({ error: "backgroundImage must be a string" }, { status: 400 });
    }

    if (customCss !== undefined && typeof customCss !== "string") {
      return NextResponse.json({ error: "customCss must be a string" }, { status: 400 });
    }

    // Validate linkIds is array of strings
    if (linkIds !== undefined) {
      if (!Array.isArray(linkIds) || !linkIds.every((id) => typeof id === "string")) {
        return NextResponse.json({ error: "linkIds must be an array of strings" }, { status: 400 });
      }
    }

    // Validate hex color strings
    const isValidHexColor = (color: unknown): boolean => {
      if (typeof color !== "string") return false;
      return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color);
    };

    if (accentColor !== undefined && !isValidHexColor(accentColor)) {
      return NextResponse.json({ error: "accentColor must be a valid hex color (e.g., #6366f1)" }, { status: 400 });
    }

    if (backgroundColor !== undefined && backgroundColor !== null && !isValidHexColor(backgroundColor)) {
      return NextResponse.json({ error: "backgroundColor must be a valid hex color or null" }, { status: 400 });
    }

    // Validate isPublic is boolean
    if (isPublic !== undefined && typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
    }

    // Check slug uniqueness
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