import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import CreateLinkId from "./CreateLinkId";
import QRCode from "./qrcode";
import type { Link } from "@prisma/client";

import { nestLinks } from "@/lib/linkTree";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
            links: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
            subscribers: { orderBy: { createdAt: 'desc' } }
        },
    });

    if (!user?.username) return <CreateLinkId />;

    const nestedLinks = nestLinks(user.links);

    return (
        <DashboardClient
            username={user.username}
            initialLinks={nestedLinks}
            initialTheme={user.theme}
            initialLayout={user.layoutStyle}
            initialBackgroundImage={user.backgroundImage}
            initialSeoTitle={user.seoTitle || ""}
            initialSeoDescription={user.seoDescription || ""}
            qrCode={<QRCode />} 
            enableEmailCapture={user.enableEmailCapture}
            subscribers={user.subscribers}
        />
    );
}

