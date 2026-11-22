import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveWorkspaceByUsernameOrAlias } from "@/lib/userLookup";

/**
 * GET: Track resume download and redirect to the resume URL
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const resolved = await resolveWorkspaceByUsernameOrAlias(username);
    if (!resolved) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: resolved.workspaceId },
      select: {
        id: true,
        resumeUrl: true,
      },
    });

    if (!workspace?.resumeUrl) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Increment the download count atomically
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { resumeDownloadCount: { increment: 1 } },
    });

    return NextResponse.redirect(workspace.resumeUrl);
  } catch (error) {
    console.error("Error tracking resume download:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
