import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { trackLinkClick } from "@/lib/analytics";
import { getForwardedIp } from "@/lib/analyticsUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveUserByUsername } from "@/lib/userLookup";

// 30 requests per minute per IP on the click endpoint.
const CLICK_RATE_LIMIT = 30;
const CLICK_RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
    const ip = getForwardedIp(req.headers) ?? "unknown";
    const allowed = await checkRateLimit(`click:${ip}`, CLICK_RATE_LIMIT, CLICK_RATE_WINDOW_MS);
    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            {
                status: 429,
                headers: { "Retry-After": String(Math.ceil(CLICK_RATE_WINDOW_MS / 1000)) },
            },
        );
    }

    const { username, platform } = await req.json();

    if (!username || !platform) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const resolved = await resolveUserByUsername(username);
    if (!resolved) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const link = await prisma.link.findFirst({
        where: { platform, workspaceId: resolved.user.id, isPublic: true },
        select: { id: true, workspaceId: true },
    });

    if (!link) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await trackLinkClick({
        linkId: link.id,
        workspaceId: link.workspaceId,
        headers: req.headers,
    });

    return NextResponse.json({ success: true });
}
