import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import { getProfileVersions } from "@/lib/profileWorkflow";

import { ProfileHeaderCard } from "./ProfileHeaderCard";
import { AccountInfoCard } from "./AccountInfoCard";
import { ProfileActionsCard } from "./ProfileActionsCard";
import { DangerZoneCard } from "./DangerZoneCard";
import { ResumeCard } from "./ResumeCard";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
            accounts: true, 
            links: true,
            profileDraft: true,
        },
    });

    if (!user) return null;

    // Load profile versions
    const profileVersions = await getProfileVersions(user.id);

    return (
        <>
            <DashboardNavbar />

            <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
                <ProfileHeaderCard
                    user={user}
                    sessionImage={session.user.image}
                />

                <AccountInfoCard user={user} />

                <ResumeCard
                    initialResumeUrl={user.resumeUrl}
                    initialDownloadCount={user.resumeDownloadCount}
                />

                <ProfileActionsCard
                    hasPassword={Boolean(user.password)}
                    profileDraft={user.profileDraft}
                    profileVersions={profileVersions}
                />

                <DangerZoneCard
                    userEmail={user.email}
                    hasPassword={Boolean(user.password)}
                />
            </main>
        </>
    );
}
