import { publishProfileDraft } from "@/lib/profileWorkflow";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    const { published, diff } = await publishProfileDraft(user.id);

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
