import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { PlatformParams } from "../types/type";
import { trackLinkClick } from "@/lib/analytics";
import { resolveUserByUsername } from "@/lib/userLookup";

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<PlatformParams>;
}) {
    const { username, platform } = await params;

    // "share" is a static route handled by app/[username]/share/[slug]/page.tsx
    // Returning notFound() here would swallow it — redirect instead so Next.js
    // re-evaluates against the correct nested route.
    if (platform === "share") {
        notFound();
    }

    const requestHeaders = await headers();

    // Resolve username to handle redirects/aliases
    const resolved = await resolveUserByUsername(username);
    if (!resolved) {
        notFound();
    }

    const link = await prisma.link.findFirst({
        where: {
            platform,
            userId: resolved.user.id,
        },
        select: { id: true, url: true, userId: true },
    });

    if (!link) notFound();

    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
        headers: requestHeaders,
    });

    redirect(link.url);
}