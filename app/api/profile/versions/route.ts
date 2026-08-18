import { getProfileVersions } from "@/lib/profileWorkflow";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const versions = await getProfileVersions(workspace.id);

    return NextResponse.json(
      {
        versions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get versions error:", error);
    return NextResponse.json(
      { error: "Failed to get versions" },
      { status: 500 }
    );
  }
}
