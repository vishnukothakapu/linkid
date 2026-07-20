import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await ctx.params;
        const job = await prisma.job.findUnique({
            where: { id, userId: session.user.id },
        });
        if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json(job);
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
