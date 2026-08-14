import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import DashboardClient from "./DashboardClient";
import CreateLinkId from "./CreateLinkId";
import QRCode from "./qrcode";

import { nestLinks } from "@/lib/linkTree";

import { cookies } from "next/headers";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const cookieStore = await cookies();
    const preferredWorkspaceId = cookieStore.get("activeWorkspaceId")?.value || cookieStore.get("workspaceId")?.value;
    const activeWorkspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!activeWorkspace) redirect("/login");

    const workspace = await prisma.workspace.findUnique({
        where: { id: activeWorkspace.id },
        include: {
            links: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
            subscribers: { orderBy: { createdAt: 'desc' } },
            profileDraft: true,
            members: {
                where: { role: "OWNER" },
                include: {
                    user: {
                        select: { image: true },
                    },
                },
                take: 1,
            },
        },
    });

    if (!workspace) redirect("/login");

    if (!workspace.username) return <CreateLinkId />;

    const nestedLinks = nestLinks(workspace.links);
    const ownerImage = workspace.members[0]?.user.image ?? null;

    return (
        <DashboardClient
            workspaceId={workspace.id}
            username={workspace.username}
            initialLinks={nestedLinks}
            initialTheme={workspace.theme}
            initialLayout={workspace.layoutStyle}
            initialBackgroundImage={workspace.backgroundImage}
            initialSeoTitle={workspace.seoTitle || ""}
            initialSeoDescription={workspace.seoDescription || ""}
            qrCode={<QRCode />}
            enableEmailCapture={workspace.enableEmailCapture}
            subscribers={workspace.subscribers}
            initialName={workspace.profileDraft?.name ?? workspace.name}
            initialBio={workspace.profileDraft?.bio ?? workspace.bio}
            initialImage={workspace.profileDraft?.image ?? ownerImage}
            initialIsVerified={workspace.isVerified}
            initialThemeType={workspace.profileDraft?.themeType ?? workspace.themeType}
            initialThemeColor={workspace.profileDraft?.themeColor ?? workspace.themeColor}
            initialThemeCustom={workspace.profileDraft?.themeCustom ?? workspace.themeCustom}
            initialWebhookUrl={activeWorkspace.role === 'OWNER' ? workspace.webhookUrl : undefined}
            initialWebhookSecret={activeWorkspace.role === 'OWNER' ? workspace.webhookSecret : undefined}
        />
    );
}

