import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserAnalyticsSummary } from "@/lib/analytics";
import { resolveActiveWorkspace } from "@/lib/workspace";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const daysQuery = request.nextUrl.searchParams.get("days");
    const isAllTime = daysQuery === "all";
    const days = isAllTime ? null : (daysQuery ? Number.parseInt(daysQuery, 10) : 30);

    if (!isAllTime) {
        const numDays = days as number;

        if (Number.isNaN(numDays) || numDays < 1 || numDays > 365) {
            return NextResponse.json(
                { error: "days must be between 1 and 365, or 'all'" },
                { status: 400 }
            );
        }
    }

    const summary = await getUserAnalyticsSummary({
        workspaceId: workspace.id,
        days,  // null = no date filter = all time
    });

    return NextResponse.json({ summary });
}