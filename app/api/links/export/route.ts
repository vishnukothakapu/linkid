import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function escapeCsv(value: unknown) {
    const text = value == null ? "" : String(value);
    const neutralizedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${neutralizedText.replace(/"/g, '""')}"`;
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const links = await prisma.link.findMany({
        where: { userId: user.id },
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
