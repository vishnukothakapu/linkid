import {
    detectDeviceType,
    getForwardedIp,
    getVisitorKey,
    isLikelyBot,
    utcDayEndExclusive,
    utcDayStart,
} from "@/lib/analyticsUtils";
import { enqueueJob } from "@/lib/jobs";
import prisma from "@/lib/prisma";
import { computePercentChange, buildTopBreakdown } from "@/lib/analyticsMath";


const UNIQUE_VISITOR_WINDOW_HOURS = 24;

type PeriodComparison = {
    previousTotals: {
        totalClicks: number;
        uniqueClicks: number;
    };
    totalClicksChangePercent: number | "new" | null;
    uniqueClicksChangePercent: number | "new" | null;
};




type TrackClickInput = {
    linkId: string;
    workspaceId: string;
    headers: Headers;
};

export type AnalyticsJobPayload = {
    linkId: string;
    workspaceId?: string;
    userId?: string;
    userAgent: string | null;
    referrer: string | null;
    country: string | null;
    acceptLanguage: string | null;
    ip: string | null;
};

export async function trackLinkClick(input: TrackClickInput): Promise<void> {
    const { linkId, workspaceId, headers } = input;

    const userAgent = headers.get("user-agent");
    const referrer = headers.get("referer") ?? headers.get("referrer");
    const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
    const acceptLanguage = headers.get("accept-language");
    const ip = getForwardedIp(headers);

    const jobPayload: AnalyticsJobPayload = {
        linkId,
        workspaceId,
        userAgent,
        referrer,
        country,
        acceptLanguage,
        ip,
    };

    await enqueueJob("analytics-click", jobPayload);
}

export async function processAnalyticsJob(payload: AnalyticsJobPayload): Promise<void> {
    const { linkId, userAgent, referrer, country, acceptLanguage, ip } = payload;

    let effectiveWorkspaceId = payload.workspaceId;
    if (!effectiveWorkspaceId) {
        const link = await prisma.link.findUnique({
            where: { id: linkId },
            select: { workspaceId: true },
        });
        effectiveWorkspaceId = link?.workspaceId;
    }

    if (!effectiveWorkspaceId) {
        console.error(`processAnalyticsJob: Could not resolve workspaceId for link ${linkId}`);
        return;
    }

    const workspaceId = effectiveWorkspaceId;

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
                workspaceId,
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
                workspaceId,
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
            isBot: true,
            isUniqueVisitor: true,
            link: {
                select: { workspaceId: true },
            },
        },
    });

    const counters = new Map<
    string,
        {
            linkId: string;
            workspaceId: string;
            totalClicks: number;
            uniqueClicks: number;
            botClicks: number;
        }
    >();

    for (const event of events) {
        const key = event.linkId;
        const current = counters.get(key) ?? {
            linkId: event.linkId,
            workspaceId: event.link.workspaceId,
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
                workspaceId: entry.workspaceId,
                totalClicks: entry.totalClicks,
                uniqueClicks: entry.uniqueClicks,
                botClicks: entry.botClicks,
            },
            create: {
                linkId: entry.linkId,
                workspaceId: entry.workspaceId,
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

export type WorkspaceAnalyticsSummary = Awaited<ReturnType<typeof getWorkspaceAnalyticsSummary>>;
export type UserAnalyticsSummary = WorkspaceAnalyticsSummary;

export async function getWorkspaceAnalyticsSummary(input: {
    workspaceId: string;
    days: number | null;
}) {
    const rangeDays = input.days === null
        ? null
        : Math.max(1, Math.min(365, input.days));

    const start = rangeDays === null
        ? null
        : utcDayStart(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));

    const previousStart = rangeDays === null || start === null
        ? null
        : utcDayStart(new Date(start.getTime() - rangeDays * 24 * 60 * 60 * 1000));

    const allowedComparison = rangeDays === 7 || rangeDays === 30 || rangeDays === 90;

    const [
        totals,
        perLink,
        clicksOverTimeRaw,
        recentActivityEvent,
        previousTotals,
        referrerGroups,
        deviceGroups,
        countryGroups,
    ] = await Promise.all([
        prisma.dailyLinkAnalytics.aggregate({
            where: {
                workspaceId: input.workspaceId,
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
                workspaceId: input.workspaceId,
                ...(start !== null && { date: { gte: start } }),
            },
            _sum: {
                totalClicks: true,
                uniqueClicks: true,
                botClicks: true,
            },
        }),
        prisma.dailyLinkAnalytics.groupBy({
            by: ["date"],
            where: {
                workspaceId: input.workspaceId,
                ...(start !== null && { date: { gte: start } }),
            },
            _sum: {
                totalClicks: true,
                uniqueClicks: true,
                botClicks: true,
            },
            orderBy: { date: "asc" },
        }),
        prisma.clickEvent.findFirst({
            where: {
                workspaceId: input.workspaceId,
                ...(start !== null && { createdAt: { gte: start } }),
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                linkId: true,
                country: true,
                deviceType: true,
                isBot: true,
                createdAt: true,
                link: {
                    select: { platform: true, label: true },
                },
            },
        }),
        previousStart !== null && start !== null && allowedComparison
            ? prisma.dailyLinkAnalytics.aggregate({
                  where: {
                      workspaceId: input.workspaceId,
                      date: { gte: previousStart, lt: start },
                  },
                  _sum: { totalClicks: true, uniqueClicks: true },
              })
            : Promise.resolve(null),
        prisma.clickEvent.groupBy({
            by: ["referrer"],
            where: {
                workspaceId: input.workspaceId,
                isBot: false,
                ...(start !== null && { createdAt: { gte: start } }),
            },
            _count: { _all: true },
        }),
        prisma.clickEvent.groupBy({
            by: ["deviceType"],
            where: {
                workspaceId: input.workspaceId,
                isBot: false,
                ...(start !== null && { createdAt: { gte: start } }),
            },
            _count: { _all: true },
        }),
        prisma.clickEvent.groupBy({
            by: ["country"],
            where: {
                workspaceId: input.workspaceId,
                isBot: false,
                ...(start !== null && { createdAt: { gte: start } }),
            },
            _count: { _all: true },
        }),
    ]);

    const clicksOverTime = clicksOverTimeRaw.map((entry) => ({
        date: entry.date,
        totalClicks: entry._sum.totalClicks ?? 0,
        uniqueClicks: entry._sum.uniqueClicks ?? 0,
        botClicks: entry._sum.botClicks ?? 0,
    }));

    const recentActivity = recentActivityEvent
        ? {
              id: recentActivityEvent.id,
              linkId: recentActivityEvent.linkId,
              platform: recentActivityEvent.link.platform,
              label: recentActivityEvent.link.label,
              country: recentActivityEvent.country,
              deviceType: recentActivityEvent.deviceType,
              isBot: recentActivityEvent.isBot,
              createdAt: recentActivityEvent.createdAt,
          }
        : null;

    const comparison: PeriodComparison | null = previousTotals
        ? {
              previousTotals: {
                  totalClicks: previousTotals._sum.totalClicks ?? 0,
                  uniqueClicks: previousTotals._sum.uniqueClicks ?? 0,
              },
              totalClicksChangePercent: computePercentChange(
                  totals._sum.totalClicks ?? 0,
                  previousTotals._sum.totalClicks ?? 0
              ),
              uniqueClicksChangePercent: computePercentChange(
                  totals._sum.uniqueClicks ?? 0,
                  previousTotals._sum.uniqueClicks ?? 0
              ),
          }
        : null;

    const topReferrers = buildTopBreakdown(
        referrerGroups.map((g) => ({ key: g.referrer, count: g._count._all })),
        "Direct / Unknown"
    );

    const topDevices = buildTopBreakdown(
        deviceGroups.map((g) => ({ key: g.deviceType, count: g._count._all })),
        "Unknown"
    );

    const topCountries = buildTopBreakdown(
        countryGroups.map((g) => ({ key: g.country, count: g._count._all })),
        "Unknown"
    );

    if (perLink.length === 0) {
        return {
            rangeDays,
            totals: {
                totalClicks: 0,
                uniqueClicks: 0,
                botClicks: 0,
            },
            links: [],
            clicksOverTime: [],
            platformPerformance: [],
            recentActivity: null,
            comparison,
            topReferrers,
            topDevices,
            topCountries,
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

    const resolvedLinks = perLink
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
        .sort((a, b) => b.totalClicks - a.totalClicks);

    const platformPerformanceMap = new Map<
        string,
        { platform: string; totalClicks: number; uniqueClicks: number; linkCount: number }
    >();

    for (const link of resolvedLinks) {
        const current = platformPerformanceMap.get(link.platform) ?? {
            platform: link.platform,
            totalClicks: 0,
            uniqueClicks: 0,
            linkCount: 0,
        };

        current.totalClicks += link.totalClicks;
        current.uniqueClicks += link.uniqueClicks;
        current.linkCount += 1;

        platformPerformanceMap.set(link.platform, current);
    }

    const platformPerformance = Array.from(platformPerformanceMap.values()).sort(
        (a, b) => b.totalClicks - a.totalClicks
    );

    return {
        rangeDays,
        totals: {
            totalClicks: totals._sum.totalClicks ?? 0,
            uniqueClicks: totals._sum.uniqueClicks ?? 0,
            botClicks: totals._sum.botClicks ?? 0,
        },
        links: resolvedLinks,
        clicksOverTime,
        platformPerformance,
        recentActivity,
        comparison,
        topReferrers,
        topDevices,
        topCountries,
    };
}

export const getUserAnalyticsSummary = getWorkspaceAnalyticsSummary;
