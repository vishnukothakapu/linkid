import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "csv";

    // Fetch click history with link data for the authenticated user
    const clicks = await prisma.clickEvent.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            link: true,
        },
    });

    if (format === "csv") {
        // CSV field escaping: wrap in quotes and escape internal quotes and newlines
        const escapeCSV = (value: string | null | undefined): string => {
            if (value == null) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const header = "Timestamp,Link Label,URL,Referrer,Country,Device Type,User Agent\r\n";

        const rows = clicks.map((c) =>
            [
                escapeCSV(c.createdAt.toISOString()),
                escapeCSV(c.link?.label ?? ""),
                escapeCSV(c.link?.url ?? ""),
                escapeCSV(c.referrer),
                escapeCSV(c.country),
                escapeCSV(c.deviceType),
                escapeCSV(c.userAgent),
            ].join(",")
        );

        const csvContent = header + rows.join("\r\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="analytics-export.csv"`,
            },
        });
    }

    // Default: return JSON
    return NextResponse.json({ clicks });
}
