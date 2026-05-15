import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserAnalyticsSummary } from "@/lib/analytics";

export async function GET(request: NextRequest) {
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

    const daysQuery = request.nextUrl.searchParams.get("days");
    const days = daysQuery ? Number.parseInt(daysQuery, 10) : 30;

    if (Number.isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
            { error: "days must be between 1 and 365" },
            { status: 400 }
        );
    }

    const summary = await getUserAnalyticsSummary({
        userId: user.id,
        days,
    });

    return NextResponse.json({ summary });
}
