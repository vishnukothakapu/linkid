import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { getForwardedIp } from "@/lib/analyticsUtils";

const SUBSCRIBE_LIMIT = 10;
const SUBSCRIBE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // This endpoint is intentionally public (profile subscribe form), so
    // rate-limit per client IP to prevent subscriber bombing and username
    // enumeration via unlimited requests.
    const ip = getForwardedIp(req.headers) ?? "unknown";
    if (!(await checkRateLimit(`subscribe:${ip}`, SUBSCRIBE_LIMIT, SUBSCRIBE_WINDOW_MS))) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(SUBSCRIBE_WINDOW_MS / 1000) } }
      );
    }

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
