import { createProfilePreviewToken } from "@/lib/profileWorkflow";
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

    const { token, expiresAt } = await createProfilePreviewToken(user.id);

    // Build the preview URL
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
