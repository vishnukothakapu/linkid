import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getUserAnalyticsSummary, parseRangeDays } from "@/lib/analytics";
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

    const range = parseRangeDays(request.nextUrl.searchParams.get("days"));
    if ("error" in range) {
        return NextResponse.json(
            { error: range.error },
            { status: 400 }
        );
    }

    const summary = await getUserAnalyticsSummary({
        workspaceId: workspace.id,
        days: range.days,  // null = no date filter = all time
    });

    return NextResponse.json({ summary });
}