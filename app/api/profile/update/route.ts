import { NextRequest, NextResponse } from "next/server";
import { upsertProfileDraft } from "@/lib/profileWorkflow";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invalidateProfileCache } from "@/lib/profileCache";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { username, name, bio, image, themeType, themeColor, themeCustom, workspaceId: bodyWorkspaceId } = body;
    username = username?.toLowerCase();

    const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (preferredWorkspaceId && workspace.id !== preferredWorkspaceId) {
      return NextResponse.json({ error: "Forbidden: Access denied to requested workspace" }, { status: 403 });
    }

    const draft = await upsertProfileDraft(workspace.id, {
      username,
      name,
      bio,
      image,
      themeType,
      themeColor,
      themeCustom,
    });

    // Drafted edits land on the public profile once published — purge the cache
    // so any published (live) version is never served stale.
    await invalidateProfileCache(workspace.id);

    return NextResponse.json({ success: true, draft }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes("Username not available") || err.message?.includes("Username already taken")) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
