import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Body = { orderedIds?: unknown };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orderedIds = Array.isArray((body as Body).orderedIds)
      ? (body as Body).orderedIds
      : undefined;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
    }

    if (orderedIds.length > 500) {
      return NextResponse.json({ error: "Too many ids" }, { status: 400 });
    }

    // Convert to string ids and validate
    const ids = orderedIds.map((id) => String(id));

    // Verify ownership: fetch user's link ids
    const existingLinks = await prisma.link.findMany({ where: { userId: user.id }, select: { id: true } });
    const existingIds = new Set(existingLinks.map((l) => l.id));
    
    // REQUIRE all links in payload (no partial reorders)
    if (ids.length !== existingLinks.length) {
      return NextResponse.json({ error: "Must reorder all links at once" }, { status: 400 });
    }
    
    // Check all IDs belong to user
    const invalid = ids.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: "Invalid link IDs" }, { status: 403 });
    }

    // Check duplicates
    const uniq = new Set(ids);
    if (uniq.size !== ids.length) {
      return NextResponse.json({ error: "Duplicate IDs in request" }, { status: 400 });
    }

    // Fetch current positions
    const current = await prisma.link.findMany({ where: { userId: user.id }, select: { id: true, position: true } });
    const currentMap = new Map(current.map((c) => [c.id, c.position]));

    type UpdatePayload = { id: string; newOrder: number };
    // Use 1-based positions to remain consistent with creation/backfill logic
    const updates: UpdatePayload[] = ids
      .map((id, idx) => ({ id, newOrder: idx + 1 }))
      .filter(({ id, newOrder }) => currentMap.get(id) !== newOrder);

    if (updates.length === 0) return NextResponse.json({ ok: true, changed: 0 });

    // Atomic update with ownership check to avoid TOCTOU races
    const results = await prisma.$transaction(
      updates.map((u) =>
        prisma.link.updateMany({
          where: { id: u.id, userId: user.id },
          data: { position: u.newOrder },
        })
      )
    );

    // Ensure each update affected exactly one row (ownership preserved)
    if (results.some((r) => r.count !== 1)) {
      return NextResponse.json({ error: "Reorder conflict, please retry" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, changed: updates.length });
  } catch (err) {
    console.error("/api/links/reorder error", err);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
