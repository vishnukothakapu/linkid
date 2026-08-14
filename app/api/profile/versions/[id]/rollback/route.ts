import { rollbackProfileVersion } from "@/lib/profileWorkflow";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: versionId } = await params;

    const version = await prisma.profileVersion.findUnique({
      where: { id: versionId },
      select: { workspaceId: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const preferredWorkspaceId = request.headers.get("x-workspace-id") || version.workspaceId;
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace || workspace.id !== version.workspaceId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { snapshot, diff } = await rollbackProfileVersion(workspace.id, versionId);

    return NextResponse.json(
      {
        snapshot,
        diff,
        message: "Profile rolled back successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile rollback error:", error);
    if (error instanceof Error) {
      if (error.message.includes("empty snapshot")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("no longer available") || error.message.includes("taken")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Failed to rollback profile" },
      { status: 500 }
    );
  }
}
