import { NextResponse } from "next/server";

import { recomputeDailyAnalyticsForDate } from "@/lib/analytics";

function toUtcDateFromInput(raw: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return null;

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCMonth() !== month - 1) return null;
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function utcDayShift(base: Date, shift: number): Date {
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + shift));
}

export async function POST(req: Request) {
    const cronSecret = process.env.ANALYTICS_CRON_SECRET;

    if (!cronSecret) {
        return NextResponse.json(
            { error: "ANALYTICS_CRON_SECRET is not configured" },
            { status: 500 }
        );
    }

    const receivedSecret = req.headers.get("x-analytics-secret");
    if (!receivedSecret || receivedSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawDaysBack = body.daysBack;
    const daysBackInput =
        typeof rawDaysBack === "number" && Number.isFinite(rawDaysBack)
            ? rawDaysBack
            : 1;
    const daysBack = Math.max(1, Math.min(30, Math.floor(daysBackInput)));

    let dateBase = utcDayShift(new Date(), -1);
    if (typeof body.date === "string") {
        const parsed = toUtcDateFromInput(body.date);
        if (!parsed) {
            return NextResponse.json(
                { error: "date must be in YYYY-MM-DD format" },
                { status: 400 }
            );
        }
        dateBase = parsed;
    }

    const output: Array<{ date: string; rows: number }> = [];

    for (let i = 0; i < daysBack; i += 1) {
        const date = utcDayShift(dateBase, -i);
        const result = await recomputeDailyAnalyticsForDate(date);
        output.push({
            date: date.toISOString().slice(0, 10),
            rows: result.rows,
        });
    }

    return NextResponse.json({
        success: true,
        recomputedDays: output.length,
        dates: output,
    });
}
