import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createMergeRequest, MergeError } from "@/lib/accountMerge";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const password = typeof body.password === "string" ? body.password : undefined;

    try {
        const targetUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = await createMergeRequest({
            targetUserId: targetUser.id,
            password,
        });

        return NextResponse.json({
            success: true,
            code: result.code,
            expiresAt: result.expiresAt,
        });
    } catch (error) {
        if (error instanceof MergeError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("Create merge request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
