import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";

import { ProfileHeaderCard } from "./ProfileHeaderCard";
import { AccountInfoCard } from "./AccountInfoCard";
import { ProfileActionsCard } from "./ProfileActionsCard";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { accounts: true },
    });

    if (!user) return null;

    return (
        <>
            <DashboardNavbar />

            <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
                <ProfileHeaderCard
                    user={user}
                    sessionImage={session.user.image}
                />

                <AccountInfoCard user={user} />

                <ProfileActionsCard />
            </main>
        </>
    );
}
