import { createHash } from "node:crypto";

const BOT_USER_AGENT_RE = /(bot|spider|crawler|bingpreview|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|whatsapp|telegrambot|discordbot|linkedinbot|headless|lighthouse)/i;

export function getForwardedIp(headers: Headers): string | null {
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }

    const realIp = headers.get("x-real-ip")?.trim();
    return realIp || null;
}

export function isLikelyBot(userAgent: string | null | undefined): boolean {
    if (!userAgent) return true;
    return BOT_USER_AGENT_RE.test(userAgent);
}

export function detectDeviceType(userAgent: string | null | undefined): string {
    if (!userAgent) return "unknown";

    const normalized = userAgent.toLowerCase();
    if (/ipad|tablet/i.test(normalized)) return "tablet";
    if (/mobile|iphone|android(?!.*tablet)/i.test(normalized)) return "mobile";
    return "desktop";
}

export function getVisitorKey(input: {
    ip: string | null;
    userAgent: string | null;
    acceptLanguage: string | null;
}): string | null {
    const { ip, userAgent, acceptLanguage } = input;

    if (!ip || !userAgent) {
        return null;
    }

    const salt = process.env.ANALYTICS_VISITOR_KEY_SALT ?? "linkid-default-analytics-salt";
    const raw = `${salt}|${ip}|${userAgent}|${acceptLanguage ?? ""}`;
    return createHash("sha256").update(raw).digest("hex");
}

export function utcDayStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcDayEndExclusive(date: Date): Date {
    const start = utcDayStart(date);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}
