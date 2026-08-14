import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";

function escapeCsv(value: unknown) {
    const text = value == null ? "" : String(value);
    const neutralizedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${neutralizedText.replace(/"/g, '""')}"`;
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const links = await prisma.link.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
            platform: true,
            label: true,
            url: true,
            clicks: true,
            createdAt: true,
            isPublic: true,
        },
    });

    const rows = [
        ["platform", "label", "url", "clicks", "createdDate", "isPublic"],
        ...links.map((link) => [
            link.platform,
            link.label,
            link.url,
            String(link.clicks),
            link.createdAt.toISOString(),
            link.isPublic ? "true" : "false",
        ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="linkid-links-${date}.csv"`,
        },
    });
}
