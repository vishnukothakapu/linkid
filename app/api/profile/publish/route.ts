import { publishProfileDraft } from "@/lib/profileWorkflow";
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

    const { published, diff } = await publishProfileDraft(workspace.id);

    return NextResponse.json(
      {
        published,
        diff,
        message: "Profile published successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile publish error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to publish profile";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === "No draft to publish" ? 400 : 500 }
    );
  }
}
