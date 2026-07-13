import { NextResponse } from "next/server";
import { enqueueJob } from "@/lib/jobs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobSchema } from "@/lib/validations/jobs";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = `enqueue-job-${session.user.id}`;
    // 10 requests per minute
    if (!checkRateLimit(rateLimitKey, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = jobSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { type, payload, scheduleAt } = parsed.data;

    const job = await enqueueJob(type, payload ?? {}, scheduleAt ? { scheduleAt: new Date(scheduleAt) } : undefined);
    return NextResponse.json({ id: job.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
