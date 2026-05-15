import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { trackLinkClick } from "@/lib/analytics";

export async function POST(req: Request) {
    const { username, platform } = await req.json();

    if (!username || !platform) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const link = await prisma.link.findFirst({
        where: { platform, user: { username } },
        select: { id: true, userId: true },
    });

    if (!link) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
        headers: req.headers,
    });

    return NextResponse.json({ success: true });
}
