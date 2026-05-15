import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { username, platform } = await req.json();

    if (!username || !platform) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await prisma.link.updateMany({
        where: { platform, user: { username } },
        data: { clickCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
}
