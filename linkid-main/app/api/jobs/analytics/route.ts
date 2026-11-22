import { NextResponse } from "next/server";
import { claimNextJob, releaseJob, markJobCompleted, markJobFailed } from "@/lib/jobs";
import { processAnalyticsJob, type AnalyticsJobPayload } from "@/lib/analytics";
import type { Prisma } from "@prisma/client";

const BATCH_SIZE = 50;
const MAX_PROCESSING_TIME_MS = 50_000;

async function handleRequest(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    let processed = 0;
    let failed = 0;

    try {
        while (Date.now() - startTime < MAX_PROCESSING_TIME_MS && processed < BATCH_SIZE) {
            const job = await claimNextJob("analytics-click");
            if (!job) break;

            try {
                const payload = job.payload as Prisma.JsonValue as AnalyticsJobPayload;
                await processAnalyticsJob(payload);
                await markJobCompleted(job.id);
                processed++;
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                await markJobFailed(job.id, message);
                failed++;
            }
        }

        return NextResponse.json({
            processed,
            failed,
            durationMs: Date.now() - startTime,
        });
    } catch (err) {
        console.error("[analytics-worker] Fatal error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    return handleRequest(req);
}

export async function GET(req: Request) {
    return handleRequest(req);
}
