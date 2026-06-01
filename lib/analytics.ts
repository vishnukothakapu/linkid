import prisma from "@/lib/prisma";
import {
    detectDeviceType,
    getForwardedIp,
    getVisitorKey,
    isLikelyBot,
    utcDayEndExclusive,
    utcDayStart,
} from "@/lib/analyticsUtils";

const UNIQUE_VISITOR_WINDOW_HOURS = 24;

type TrackClickInput = {
    linkId: string;
    userId: string;
    headers: Headers;
};

export async function trackLinkClick(input: TrackClickInput): Promise<void> {
    const { linkId, userId, headers } = input;

    const userAgent = headers.get("user-agent");
    const referrer = headers.get("referer") ?? headers.get("referrer");
    const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
    const acceptLanguage = headers.get("accept-language");
    const ip = getForwardedIp(headers);
    const isBot = isLikelyBot(userAgent);
    const deviceType = detectDeviceType(userAgent);
    const visitorKey = isBot
        ? null
        : getVisitorKey({
              ip,
              userAgent,
              acceptLanguage,
          });

    const uniqueWindowStart = new Date(Date.now() - UNIQUE_VISITOR_WINDOW_HOURS * 60 * 60 * 1000);

    const existingRecentClick = !isBot && visitorKey
        ? await prisma.clickEvent.findFirst({
              where: {
                  linkId,
                  visitorKey,
                  isBot: false,
                  createdAt: { gte: uniqueWindowStart },
              },
              select: { id: true },
          })
        : null;

    const isUniqueVisitor = Boolean(!isBot && visitorKey && !existingRecentClick);
    const today = utcDayStart(new Date());

    await prisma.$transaction([
        prisma.clickEvent.create({
            data: {
                linkId,
                userId,
                visitorKey,
                userAgent,
                referrer,
                country,
                deviceType,
                isBot,
                isUniqueVisitor,
            },
        }),
        prisma.dailyLinkAnalytics.upsert({
            where: {
                linkId_date: {
                    linkId,
                    date: today,
                },
            },
            update: {
                totalClicks: { increment: isBot ? 0 : 1 },
                uniqueClicks: { increment: isUniqueVisitor ? 1 : 0 },
                botClicks: { increment: isBot ? 1 : 0 },
            },
            create: {
                linkId,
                userId,
                date: today,
                totalClicks: isBot ? 0 : 1,
                uniqueClicks: isUniqueVisitor ? 1 : 0,
                botClicks: isBot ? 1 : 0,
            },
        }),
        prisma.link.update({
            where: { id: linkId },
            data: { clicks: { increment: isBot ? 0 : 1 } },
        }),
    ]);
}

export async function recomputeDailyAnalyticsForDate(date: Date): Promise<{ rows: number }> {
    const start = utcDayStart(date);
    const endExclusive = utcDayEndExclusive(date);

    const events = await prisma.clickEvent.findMany({
        where: {
            createdAt: {
                gte: start,
                lt: endExclusive,
            },
        },
        select: {
            linkId: true,
            userId: true,
            isBot: true,
            isUniqueVisitor: true,
        },
    });

    const counters = new Map<
    string,
        {
            linkId: string;
            userId: string;
            totalClicks: number;
            uniqueClicks: number;
            botClicks: number;
        }
    >();

    for (const event of events) {
        const key = event.linkId;
        const current = counters.get(key) ?? {
            linkId: event.linkId,
            userId: event.userId,
            totalClicks: 0,
            uniqueClicks: 0,
            botClicks: 0,
        };

        if (event.isBot) {
            current.botClicks += 1;
        } else {
            current.totalClicks += 1;
        }

        if (event.isUniqueVisitor) {
            current.uniqueClicks += 1;
        }

        counters.set(key, current);
    }

    const upserts = Array.from(counters.values()).map((entry) =>
        prisma.dailyLinkAnalytics.upsert({
            where: {
                linkId_date: {
                    linkId: entry.linkId,
                    date: start,
                },
            },
            update: {
                userId: entry.userId,
                totalClicks: entry.totalClicks,
                uniqueClicks: entry.uniqueClicks,
                botClicks: entry.botClicks,
            },
            create: {
                linkId: entry.linkId,
                userId: entry.userId,
                date: start,
                totalClicks: entry.totalClicks,
                uniqueClicks: entry.uniqueClicks,
                botClicks: entry.botClicks,
            },
        })
    );

    if (upserts.length > 0) {
        await prisma.$transaction(upserts);
    }

    return { rows: upserts.length };
}

export async function getUserAnalyticsSummary(input: {
    userId: string;
    days: number | null;
}) {
    const rangeDays = input.days === null
        ? null
        : Math.max(1, Math.min(365, input.days));

    const start = rangeDays === null
        ? null
        : utcDayStart(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));

    const [totals, perLink] = await Promise.all([
        prisma.dailyLinkAnalytics.aggregate({
            where: {
                userId: input.userId,
                ...(start !== null && { date: { gte: start } }),
            },
            _sum: {
                totalClicks: true,
                uniqueClicks: true,
                botClicks: true,
            },
        }),
        prisma.dailyLinkAnalytics.groupBy({
            by: ["linkId"],
            where: {
                userId: input.userId,
                ...(start !== null && { date: { gte: start } }),
            },
            _sum: {
                totalClicks: true,
                uniqueClicks: true,
                botClicks: true,
            },
        }),
    ]);

    if (perLink.length === 0) {
        return {
            rangeDays,
            totals: {
                totalClicks: 0,
                uniqueClicks: 0,
                botClicks: 0,
            },
            links: [],
        };
    }

    const links = await prisma.link.findMany({
        where: {
            id: {
                in: perLink.map((entry) => entry.linkId),
            },
        },
        select: {
            id: true,
            platform: true,
            label: true,
            url: true,
            isPublic: true,
        },
    });

    const linksById = new Map(links.map((link) => [link.id, link]));

    return {
        rangeDays,
        totals: {
            totalClicks: totals._sum.totalClicks ?? 0,
            uniqueClicks: totals._sum.uniqueClicks ?? 0,
            botClicks: totals._sum.botClicks ?? 0,
        },
        links: perLink
            .map((entry) => {
                const link = linksById.get(entry.linkId);
                if (!link) return null;

                return {
                    id: link.id,
                    platform: link.platform,
                    label: link.label,
                    url: link.url,
                    isPublic: link.isPublic,
                    totalClicks: entry._sum.totalClicks ?? 0,
                    uniqueClicks: entry._sum.uniqueClicks ?? 0,
                    botClicks: entry._sum.botClicks ?? 0,
                };
            })
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
            .sort((a, b) => b.totalClicks - a.totalClicks),
    };
}