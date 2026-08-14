import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { enableEmailCapture, workspaceId: bodyWorkspaceId } = body;

    const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (typeof enableEmailCapture !== "boolean") {
      return NextResponse.json({ error: "enableEmailCapture must be a boolean" }, { status: 400 });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { enableEmailCapture },
    });

    return NextResponse.json({ success: true, enableEmailCapture: updatedWorkspace.enableEmailCapture }, { status: 200 });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
