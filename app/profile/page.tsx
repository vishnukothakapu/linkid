import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";


import { ProfileHeaderCard } from "./ProfileHeaderCard";
import { AccountInfoCard } from "./AccountInfoCard";
import { TwoFactorCard } from "./TwoFactorCard";
import { ProfileActionsCard } from "./ProfileActionsCard";
import { DangerZoneCard } from "./DangerZoneCard";
import { ResumeCard } from "./ResumeCard";
import { ThemeBuilderCard } from "./ThemeBuilderCard";

import { cookies } from "next/headers";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const cookieStore = await cookies();
    const preferredWorkspaceId = cookieStore.get("activeWorkspaceId")?.value || cookieStore.get("workspaceId")?.value;
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace) redirect("/login");

    const [workspaceData, currentUser] = await Promise.all([
        prisma.workspace.findUnique({
            where: { id: workspace.id },
            include: {
                members: {
                    where: { role: "OWNER" },
                    include: {
                        user: {
                            select: {
                                image: true,
                            },
                        },
                    },
                    take: 1,
                },
                profileDraft: true,
            },
        }),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                password: true,
                twoFactorEnabled: true,
                accounts: {
                    select: { provider: true },
                },
            },
        }),
    ]);

    if (!workspaceData) redirect("/login");

    const owner = workspaceData.members[0]?.user;

    return (
        <>
            <DashboardNavbar />

            <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
                <ProfileHeaderCard
                    workspaceId={workspaceData.id}
                    user={{
                        name: workspaceData.name,
                        username: workspaceData.username,
                        bio: workspaceData.bio,
                        createdAt: workspaceData.createdAt,
                        image: owner?.image ?? null,
                    }}
                    sessionImage={session.user.image}
                />

                <AccountInfoCard
                    user={{
                        name: currentUser?.name ?? null,
                        email: currentUser?.email ?? session.user.email ?? "",
                        image: currentUser?.image ?? null,
                        accounts: currentUser?.accounts ?? [],
                    }}
                />

                <TwoFactorCard
                    enabled={currentUser?.twoFactorEnabled ?? false}
                    hasPassword={Boolean(currentUser?.password)}
                />

                <ResumeCard
                    initialResumeUrl={workspaceData.resumeUrl}
                    initialDownloadCount={workspaceData.resumeDownloadCount}
                />

                <ThemeBuilderCard
                    workspaceId={workspaceData.id}
                    initialThemeType={workspaceData.profileDraft?.themeType ?? workspaceData.themeType}
                    initialThemeColor={workspaceData.profileDraft?.themeColor ?? workspaceData.themeColor}
                    initialThemeCustom={workspaceData.profileDraft?.themeCustom ?? workspaceData.themeCustom}
                    userName={workspaceData.name ?? null}
                    userBio={workspaceData.bio ?? null}
                    userImage={owner?.image ?? null}
                />

                <ProfileActionsCard
                    workspaceId={workspaceData.id}
                    hasPassword={Boolean(currentUser?.password)}
                    profileDraft={workspaceData.profileDraft}
                />

                <DangerZoneCard
                    userEmail={currentUser?.email ?? session.user.email ?? ""}
                    hasPassword={Boolean(currentUser?.password)}
                />
            </main>
        </>
    );
}
