import QRCodeLib from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import QRCodeButton from "@/components/ui/QRCodeButton";

async function generateQRCode(workspaceId?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    let workspaceToUseId = workspaceId;
    if (!workspaceToUseId) {
        const workspace = await resolveActiveWorkspace(session.user.id);
        if (!workspace) redirect("/dashboard");
        workspaceToUseId = workspace.id;
    }

    const workspaceData = await prisma.workspace.findUnique({
        where: { id: workspaceToUseId },
        include: {
            members: {
                where: { role: "OWNER" },
                include: { user: { select: { image: true } } },
                take: 1,
            },
        },
    });

    if (!workspaceData?.username) redirect("/dashboard");

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://linkid.qzz.io";
        const url = `${baseUrl}/${workspaceData.username}`;
        const qrCode = await QRCodeLib.toDataURL(url);
        const ownerImage = workspaceData.members[0]?.user.image ?? null;
        return { qrCode, username: workspaceData.username, name: workspaceData.name, image: ownerImage };
    } catch (error) {
        console.error(error);
    }
}

export default async function QRCode({ workspaceId }: { workspaceId?: string }) {
    const data = await generateQRCode(workspaceId);
    const qrCode = data?.qrCode ?? "";
    return <QRCodeButton qrCode={qrCode} avatarUrl={data?.image ?? undefined} username={data?.name ?? "User"} linkidUsername={data?.username ?? undefined} />;
}