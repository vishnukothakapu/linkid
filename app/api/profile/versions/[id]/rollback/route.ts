import { rollbackProfileVersion } from "@/lib/profileWorkflow";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { id: versionId } = await params;
    const { snapshot, diff } = await rollbackProfileVersion(user.id, versionId);

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
    const message =
      error instanceof Error ? error.message : "Failed to rollback profile";
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}
