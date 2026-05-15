import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { PlatformParams } from "../types/type";
import { trackLinkClick } from "@/lib/analytics";

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<PlatformParams>;
}) {
    const { username, platform } = await params;
    const requestHeaders = await headers();

    let link: { id: string; url: string; userId: string } | null = null;
    try {
        link = await prisma.link.findFirst({
            where: {
                platform,
                user: { username },
            },
            select: { id: true, url: true, userId: true },
        });
    } catch {
        notFound();
    }

    if (!link) {
        notFound();
    }

    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
        headers: requestHeaders,
    });

    redirect(link.url);
}
