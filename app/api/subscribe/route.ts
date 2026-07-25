import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const username = body.username;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.length > 255 || !emailRegex.test(email) || !username) {
      return NextResponse.json({ error: "A valid email and username are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, enableEmailCapture: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.enableEmailCapture) {
      return NextResponse.json({ error: "Email capture is not enabled for this profile" }, { status: 403 });
    }

    // Upsert or create subscriber
    await prisma.subscriber.create({
      data: {
        email,
        userId: user.id,
      },
    }).catch(err => {
        // If unique constraint fails, it means already subscribed
        if (err.code === 'P2002') {
            return;
        }
        throw err;
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
