import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PlatformParams } from "../types/type";

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<PlatformParams>;
}) {
    const { username, platform } = await params;

    let link: { id: string; url: string } | null = null;
    try {
        link = await prisma.link.findFirst({
            where: {
                platform,
                user: { username },
            },
            select: { id: true, url: true },
        });
    } catch {
        notFound();
    }

    if (!link) {
        notFound();
    }

    await prisma.link.update({
        where: { id: link.id },
        data: {
         clickCount: { increment: 1 },
         lastClickedAt: new Date(),
        }
    });

    redirect(link.url);
}
