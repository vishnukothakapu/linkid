import { createProfilePreviewToken } from "@/lib/profileWorkflow";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preferredWorkspaceId = request.headers.get("x-workspace-id") || request.nextUrl?.searchParams?.get("workspaceId");
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (preferredWorkspaceId && workspace.id !== preferredWorkspaceId) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to requested workspace" },
        { status: 403 }
      );
    }

    const { token, expiresAt } = await createProfilePreviewToken(workspace.id);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const previewUrl = `${baseUrl}/preview/${token}`;

    return NextResponse.json(
      {
        previewUrl,
        expiresAt,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Preview token creation error:", error);
    return NextResponse.json(
      { error: "Failed to create preview token" },
      { status: 500 }
    );
  }
}
