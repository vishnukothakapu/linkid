import { getProfileVersions } from "@/lib/profileWorkflow";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const versions = await getProfileVersions(user.id);

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
