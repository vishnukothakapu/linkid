import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId");
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        const subscribers = await prisma.subscriber.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { createdAt: "desc" },
        });

        const formatCsvField = (field: string) => {
            const str = String(field);
            const needsPrefix = /^[=+\-@]/.test(str);
            const prefixed = needsPrefix ? `'${str}` : str;
            return `"${prefixed.replace(/"/g, '""')}"`;
        };

        const csvRows = ["id,email,createdAt"];
        for (const sub of subscribers) {
            csvRows.push(`${formatCsvField(sub.id)},${formatCsvField(sub.email)},${formatCsvField(sub.createdAt.toISOString())}`);
        }
        
        const csvString = csvRows.join("\n");

        return new NextResponse(csvString, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": 'attachment; filename="subscribers.csv"',
            },
        });
    } catch (error) {
        console.error("Export subscribers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
