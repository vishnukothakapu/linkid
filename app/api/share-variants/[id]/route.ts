// app/api/share-variants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { isValidSlug } from "@/lib/url";

async function getVariantForUser(id: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const variant = await prisma.shareVariant.findUnique({ where: { id } });
  if (!variant || variant.userId !== user.id) return null;
  return { variant, user };
}

// ── PUT /api/share-variants/[id] ──────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // params may be a Promise in the app router — await and destructure id
  const { id } = (await params) as { id: string };
  const found = await getVariantForUser(id, session.user.email);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { slug, title, description, linkIds, accentColor, logo, backgroundColor, isPublic, isActive, backgroundImage, customCss } = body;

  // Validate and sanitize field types before Prisma update
  if (slug !== undefined) {
    if (typeof slug !== "string" || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: "slug must be a string with 2–40 lowercase letters, numbers, or hyphens" },
        { status: 400 }
      );
    }
  }

  if (title !== undefined && typeof title !== "string") {
    return NextResponse.json({ error: "title must be a string" }, { status: 400 });
  }

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

  if (accentColor !== undefined && typeof accentColor !== "string") {
    return NextResponse.json({ error: "accentColor must be a string" }, { status: 400 });
  }

  if (backgroundColor !== undefined && typeof backgroundColor !== "string") {
    return NextResponse.json({ error: "backgroundColor must be a string" }, { status: 400 });
  }

  if (linkIds !== undefined) {
    if (!Array.isArray(linkIds) || !linkIds.every((id) => typeof id === "string")) {
      return NextResponse.json({ error: "linkIds must be an array of strings" }, { status: 400 });
    }
  }

  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
  }

  // Check slug uniqueness if it changed
  if (slug && slug !== found.variant.slug) {
    const conflict = await prisma.shareVariant.findUnique({
      where: { userId_slug: { userId: found.user.id, slug } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  const updated = await prisma.shareVariant.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(linkIds !== undefined && { linkIds }),
      ...(accentColor !== undefined && { accentColor }),
      ...(logo !== undefined && { logo }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(isPublic !== undefined && { isPublic }),
      ...(isActive !== undefined && { isActive }),
      ...(backgroundImage !== undefined && { backgroundImage }),
      ...(customCss !== undefined && { customCss }),
    },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/share-variants/[id] ──────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = (await params) as { id: string };
  const found = await getVariantForUser(id, session.user.email);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.shareVariant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}