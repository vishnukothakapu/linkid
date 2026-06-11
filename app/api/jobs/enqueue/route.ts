import { NextResponse } from "next/server";
import { enqueueJob } from "../../../../lib/jobs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, payload, scheduleAt } = body;
    if (!type) return NextResponse.json({ error: "missing type" }, { status: 400 });

    const job = await enqueueJob(type, payload ?? {}, scheduleAt ? { scheduleAt: new Date(scheduleAt) } : undefined);
    return NextResponse.json({ id: job.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
