import { NextResponse } from "next/server";
import { getJob } from "../../../../lib/jobs";

export async function GET(_req: Request, ctx: any) {
  try {
    const params = ctx?.params ? ctx.params : (await ctx?.params);
    const id = params?.id;
    const job = await getJob(id);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
