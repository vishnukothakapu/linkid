import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";
import { resolveActiveWorkspace } from "@/lib/workspace";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import {
    invalidateProfileCache,
    invalidateProfileUsername,
} from "@/lib/profileCache";
import { acquireUsernameLock, UsernameTakenError } from "@/lib/usernameLock";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    let { username } = body;
    username = username?.toLowerCase();

    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (workspace.username === username) {
      return NextResponse.json({ success: true, workspace: { id: workspace.id, username } }, { status: 200 });
    }

    const [existingWorkspace, existingAlias] = await Promise.all([
      prisma.workspace.findUnique({ where: { username } }),
      prisma.workspaceAlias.findUnique({ where: { username } }),
    ]);

    if (existingWorkspace || existingAlias) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const updatedWorkspace = await prisma.$transaction(async (tx) => {
      // The pre-transaction check above can race with a concurrent claim or a
      // profile publish, so recheck while holding the advisory lock for this
      // username. The lock is released at commit, after the update lands.
      await acquireUsernameLock(tx, username);

      const [existingWorkspaceInTx, existingAliasInTx] = await Promise.all([
        tx.workspace.findUnique({ where: { username } }),
        tx.workspaceAlias.findUnique({ where: { username } }),
      ]);

      if (existingWorkspaceInTx || existingAliasInTx) {
        throw new UsernameTakenError();
      }

      if (workspace.username) {
        await tx.workspaceAlias.upsert({
          where: { username: workspace.username },
          update: { workspaceId: workspace.id },
          create: { username: workspace.username, workspaceId: workspace.id },
        });
      }

      return tx.workspace.update({
        where: { id: workspace.id },
        data: { username },
        select: { id: true, username: true },
      });
    });

    // Claiming a username publishes the profile — purge the Redis payload and
    // the sitemap-backed Next data cache. Clear the claimed username's index
    // too so any stale entry left by a previous owner never resolves to them.
    await invalidateProfileCache(workspace.id);
    await invalidateProfileUsername(username);
    revalidateTag("public-profile", "default");

    return NextResponse.json({ success: true, workspace: updatedWorkspace }, { status: 200 });

  } catch (error: unknown) {
    if (error instanceof UsernameTakenError) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Username create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
