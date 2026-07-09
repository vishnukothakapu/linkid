import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enqueueJob } from "@/lib/jobs";
import { enqueueJobSchema } from "@/lib/validations/jobs";
import { checkRateLimit } from "@/lib/rateLimit";

const ENQUEUE_LIMIT = 10;
const ENQUEUE_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = checkRateLimit(
        `job-enqueue:${session.user.email}`,
        ENQUEUE_LIMIT,
        ENQUEUE_WINDOW_MS
    );

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const parsed = enqueueJobSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = parsed.error.errors[0]?.message ?? "Invalid request";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { type, payload, scheduleAt } = parsed.data;
        const job = await enqueueJob(
            type,
            payload,
            scheduleAt ? { scheduleAt: new Date(scheduleAt) } : undefined
        );
        return NextResponse.json({ id: job.id });
    } catch (err: unknown) {
        return NextResponse.json({
            error: err instanceof Error ? err.message : String(err),
        }, { status: 500 });
    }
}
