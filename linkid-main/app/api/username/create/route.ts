import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import {
    invalidateProfileUsername,
    writeThroughProfileCache,
} from "@/lib/profileCache";
import {
  lockProfileUsernames,
  lockProfileWorkspace,
} from "@/lib/profileLocks";

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");
    const allowed = await checkRateLimit(`username-create:${ip}`, 10, 60_000);

    if (!allowed) {
      return rateLimitResponse(10, 60_000, { error: "Too many requests. Please try again later." });
    }

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

    const updatedWorkspace = await prisma.$transaction(async (tx) => {
      await lockProfileWorkspace(tx, workspace.id);

      const currentWorkspace = await tx.workspace.findUnique({
        where: { id: workspace.id },
        select: { id: true, username: true },
      });

      if (!currentWorkspace) {
        throw new Error("Workspace not found");
      }

      await lockProfileUsernames(tx, [currentWorkspace.username, username]);

      if (currentWorkspace.username === username) {
        return currentWorkspace;
      }

      const [existingWorkspace, existingAlias] = await Promise.all([
        tx.workspace.findUnique({ where: { username } }),
        tx.workspaceAlias.findUnique({ where: { username } }),
      ]);

      if (existingWorkspace || existingAlias) {
        throw new Error("Username already taken");
      }

      if (currentWorkspace.username) {
        await tx.workspaceAlias.upsert({
          where: { username: currentWorkspace.username },
          update: { workspaceId: workspace.id },
          create: {
            username: currentWorkspace.username,
            workspaceId: workspace.id,
          },
        });
      }

      return tx.workspace.update({
        where: { id: workspace.id },
        data: { username },
        select: { id: true, username: true },
      });
    });

    // Claiming a username publishes the profile — eagerly purge and repopulate the
    // Redis payload and refresh the sitemap-backed Next data cache. Clear any stale index.
    await invalidateProfileUsername(username);
    await writeThroughProfileCache(workspace.id);
    revalidateTag("public-profile", "default");

    return NextResponse.json({ success: true, workspace: updatedWorkspace }, { status: 200 });

    } catch (error: unknown) {
    const err = error as { code?: string; message?: string; meta?: { target?: string[] } };

    if (
      err.message === "Username already taken" ||
      (err.code === "P2002" && err.meta?.target?.includes("username"))
    ) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    console.error("Username creation failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}