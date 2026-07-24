import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { completeAccountMerge, MergeError } from "@/lib/accountMerge";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const code = typeof body.code === "string" ? body.code : "";
    const password = typeof body.password === "string" ? body.password : undefined;

    if (!code) {
        return NextResponse.json({ error: "Merge code is required" }, { status: 400 });
    }

    const sourceUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!sourceUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const result = await completeAccountMerge({
            sourceUserId: sourceUser.id,
            code,
            password,
        });

        return NextResponse.json({
            success: true,
            mergedLinks: result.mergedLinks,
            mergedAccounts: result.mergedAccounts,
            transferredSessions: result.transferredSessions,
            conflicts: result.conflicts,
        });
    } catch (error) {
        if (error instanceof MergeError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("Complete merge error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
