import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { enableEmailCapture } = body;

    if (typeof enableEmailCapture !== "boolean") {
      return NextResponse.json({ error: "enableEmailCapture must be a boolean" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { enableEmailCapture },
    });

    return NextResponse.json({ success: true, enableEmailCapture: user.enableEmailCapture }, { status: 200 });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
