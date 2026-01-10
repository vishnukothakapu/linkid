import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<{ username: string; platform: string }>;
}) {
    const { username, platform } = await params; 

    const link = await prisma.link.findFirst({
        where: {
            platform,
            user: { username },
        },
    });

    if (!link) {
        notFound();
    }

    redirect(link.url);
}
