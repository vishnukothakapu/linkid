import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Click history is exported in bounded batches instead of a single
// unbounded findMany. A link with tens of thousands of clicks would
// otherwise force the whole table into memory and onto the wire in one
// shot. Cursor pagination on `id` keeps each query and each emitted chunk
// small regardless of how large the underlying click history has grown.
const EXPORT_BATCH_SIZE = 1000;

type ExportClick = Prisma.ClickEventGetPayload<{ include: { link: true } }>;

function escapeCSV(value: string | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function clickToCSVRow(c: ExportClick): string {
    return [
        escapeCSV(c.createdAt.toISOString()),
        escapeCSV(c.link?.label ?? ""),
        escapeCSV(c.link?.url ?? ""),
        escapeCSV(c.referrer),
        escapeCSV(c.country),
        escapeCSV(c.deviceType),
        escapeCSV(c.userAgent),
    ].join(",");
}

async function* iterateClicksInBatches(userId: string): AsyncGenerator<ExportClick[]> {
    let cursor: string | undefined;

    while (true) {
        const batch: ExportClick[] = await prisma.clickEvent.findMany({
            where: { userId },
            orderBy: { id: "asc" },
            take: EXPORT_BATCH_SIZE,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            include: { link: true },
        });

        if (batch.length === 0) return;

        yield batch;

        if (batch.length < EXPORT_BATCH_SIZE) return;
        cursor = batch[batch.length - 1].id;
    }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "csv";

    if (format === "csv") {
        const encoder = new TextEncoder();
        const header = "Timestamp,Link Label,URL,Referrer,Country,Device Type,User Agent\r\n";

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                controller.enqueue(encoder.encode(header));

                let isFirstRow = true;
                try {
                    for await (const batch of iterateClicksInBatches(userId)) {
                        const rows = batch.map(clickToCSVRow);
                        const chunk = (isFirstRow ? "" : "\r\n") + rows.join("\r\n");
                        controller.enqueue(encoder.encode(chunk));
                        isFirstRow = false;
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new NextResponse(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="analytics-export.csv"`,
            },
        });
    }

    // JSON format: paginate with a cursor so a single request can't be used
    // to pull an unbounded number of rows into memory.
    const limitParam = searchParams.get("limit");
    const cursorParam = searchParams.get("cursor");

    const limit = Math.max(1, Math.min(2000, limitParam ? Number.parseInt(limitParam, 10) || 500 : 500));

    const clicks = await prisma.clickEvent.findMany({
        where: { userId },
        orderBy: { id: "asc" },
        take: limit + 1,
        ...(cursorParam ? { skip: 1, cursor: { id: cursorParam } } : {}),
        include: { link: true },
    });

    const hasMore = clicks.length > limit;
    const page = hasMore ? clicks.slice(0, limit) : clicks;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json({ clicks: page, nextCursor });
}
