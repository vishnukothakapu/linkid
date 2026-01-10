import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import CreateLinkId from "./CreateLinkId";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { links: { orderBy: { order: 'asc' } } },
    });

    if (!user?.username) return <CreateLinkId />;

    return (
        <DashboardClient
            username={user.username}
            initialLinks={user.links}
        />
    );
}
