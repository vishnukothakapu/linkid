import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET: Track resume download and redirect to the resume URL
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { 
        resumeUrl: true, 
        resumeDownloadCount: true,
        username: true,
        name: true,
      },
    });

    // If no user or no resume URL, return 404
    if (!user || !user.resumeUrl) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Increment the download count atomically
    await prisma.user.update({
      where: { username },
      data: { resumeDownloadCount: { increment: 1 } },
    });

    // Redirect to the resume URL
    return NextResponse.redirect(user.resumeUrl);
  } catch (error) {
    console.error("Error tracking resume download:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
