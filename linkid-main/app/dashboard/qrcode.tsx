import QRCodeLib from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import QRCodeButton from "@/components/ui/QRCodeButton";

async function generateQRCode() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) redirect("/dashboard");

    const workspaceData = await prisma.workspace.findUnique({
        where: { id: workspace.id },
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

export default async function QRCode() {
    const data = await generateQRCode();
    const qrCode = data?.qrCode ?? "";
    return <QRCodeButton qrCode={qrCode} avatarUrl={data?.image ?? undefined} username={data?.name ?? "User"} linkidUsername={data?.username ?? undefined} />;
}