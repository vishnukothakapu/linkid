import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJob } from "@/lib/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership filtering is not implemented because the Job model
    // does not currently store a userId. Once that field is added,
    // authorize by comparing session.user.id against job.userId.

    try {
        const { id } = await ctx.params;
        const job = await getJob(id);
        if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json(job);
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
