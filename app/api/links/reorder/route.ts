import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { invalidateProfileCache } from "@/lib/profileCache";

type Body = { orderedIds?: unknown; groupOrders?: unknown };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orderedIds = Array.isArray((body as Body).orderedIds)
      ? (body as Body).orderedIds as string[]
      : undefined;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
    }

    if (orderedIds.length > 500) {
      return NextResponse.json({ error: "Too many ids" }, { status: 400 });
    }

    // Parse groupOrders: { [groupId]: string[] }
    const groupOrders: Record<string, string[]> = {};
    if (body.groupOrders && typeof body.groupOrders === "object" && !Array.isArray(body.groupOrders)) {
      for (const [gid, children] of Object.entries(body.groupOrders as Record<string, unknown>)) {
        if (Array.isArray(children)) {
          groupOrders[gid] = children.map(String);
        }
      }
    }

    // Convert to string ids
    const topIds = orderedIds.map((id) => String(id));

    // Collect ALL ids from payload
    const allPayloadIds = new Set(topIds);
    for (const [groupId, children] of Object.entries(groupOrders)) {
      allPayloadIds.add(groupId);
      for (const cid of children) {
        allPayloadIds.add(cid);
      }
    }

    // Verify ownership: fetch user's link ids
    const existingLinks = await prisma.link.findMany({ where: { workspaceId: workspace.id }, select: { id: true, parentId: true, isGroup: true } });
    const existingMap = new Map(existingLinks.map((l) => [l.id, l]));
    const existingIds = new Set(existingLinks.map((l) => l.id));

    // REQUIRE all links in payload (no partial reorders)
    if (allPayloadIds.size !== existingLinks.length) {
      return NextResponse.json({ error: "Must reorder all links at once" }, { status: 400 });
    }

    // Check all IDs belong to user
    for (const pid of allPayloadIds) {
      if (!existingIds.has(pid)) {
        return NextResponse.json({ error: "Invalid link IDs" }, { status: 403 });
      }
    }

    // Validate groupOrders keys and child kinds
    for (const groupId of Object.keys(groupOrders)) {
      if (!topIds.includes(groupId)) {
        return NextResponse.json({ error: "Groups must be at the top level" }, { status: 400 });
      }
      const groupLink = existingMap.get(groupId);
      if (!groupLink || !groupLink.isGroup) {
        return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
      }
    }
    
    for (const children of Object.values(groupOrders)) {
      for (const cid of children) {
        const childLink = existingMap.get(cid);
        if (childLink?.isGroup) {
          return NextResponse.json({ error: "Groups cannot be nested" }, { status: 400 });
        }
      }
    }

    // Check for duplicates across top-level + all group children
    if (allPayloadIds.size !== topIds.length + Object.values(groupOrders).reduce((s, c) => s + c.length, 0)) {
      return NextResponse.json({ error: "Duplicate IDs in request" }, { status: 400 });
    }

    // Fetch current positions and parentIds
    const current = await prisma.link.findMany({ where: { workspaceId: workspace.id }, select: { id: true, position: true, parentId: true } });
    const currentMap = new Map(current.map((c) => [c.id, { position: c.position, parentId: c.parentId }]));

    type UpdatePayload = { id: string; newOrder: number; newParentId: string | null };
    const updates: UpdatePayload[] = [];

    // Top-level ordering (parentId = null)
    for (let i = 0; i < topIds.length; i++) {
      const id = topIds[i];
      const newOrder = i + 1;
      const cur = currentMap.get(id);
      if (cur?.position !== newOrder || cur?.parentId !== null) {
        updates.push({ id, newOrder, newParentId: null });
      }
    }

    // Group children ordering
    for (const [groupId, childIds] of Object.entries(groupOrders)) {
      for (let i = 0; i < childIds.length; i++) {
        const id = childIds[i];
        const newOrder = i + 1;
        const cur = currentMap.get(id);
        if (cur?.position !== newOrder || cur?.parentId !== groupId) {
          updates.push({ id, newOrder, newParentId: groupId });
        }
      }
    }

    if (updates.length === 0) return NextResponse.json({ ok: true, changed: 0 });

    // Atomic update with ownership check to avoid TOCTOU races
    try {
      await prisma.$transaction(async (tx) => {
        for (const u of updates) {
          const result = await tx.link.updateMany({
            where: { id: u.id, workspaceId: workspace.id },
            data: { position: u.newOrder, parentId: u.newParentId },
          });

          // Ensure each update affected exactly one row (ownership preserved)
          if (result.count !== 1) {
            throw new Error("REORDER_CONFLICT");
          }
        }
      });
    } catch (err) {
      if (err instanceof Error && err.message === "REORDER_CONFLICT") {
        return NextResponse.json({ error: "Reorder conflict, please retry" }, { status: 409 });
      }
      throw err;
    }

    // Link order is part of the public profile payload — purge the cache.
    await invalidateProfileCache(workspace.id);

    return NextResponse.json({ ok: true, changed: updates.length });
  } catch (err) {
    console.error("/api/links/reorder error", err);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
