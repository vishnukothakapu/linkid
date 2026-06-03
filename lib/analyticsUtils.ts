import { createHash } from "node:crypto";

const BOT_USER_AGENT_RE = /(bot|spider|crawler|bingpreview|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|whatsapp|telegrambot|discordbot|linkedinbot|headless|lighthouse)/i;

/**
 * Returns true when the given IPv4 address falls inside one of the RFC-1918
 * private ranges (10/8, 172.16/12, 192.168/16) or the loopback range (127/8).
 *
 * Only IPv4 is checked here because X-Forwarded-For values from typical
 * reverse-proxy deployments (nginx, Vercel edge, ALB) are IPv4.
 */
export function isPrivateIp(ip: string): boolean {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
        return false;
    }
    const [a, b] = parts;
    return (
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
    );
}

/**
 * Derives the real client IP from request headers in a way that resists
 * spoofing via a client-supplied X-Forwarded-For header.
 *
 * Trust hierarchy (highest to lowest):
 *   1. x-real-ip  -- set by trusted infrastructure (Vercel edge, nginx real_ip).
 *      Never forwarded from the client; use this as-is when present.
 *   2. x-forwarded-for (first hop) -- trusted ONLY when x-real-ip indicates
 *      the immediate upstream is a private/loopback address, meaning the
 *      request arrived through a known internal reverse proxy.
 *      If the upstream IP is public, the header may have been injected by the
 *      client and is discarded.
 *
 * This prevents an attacker from rotating X-Forwarded-For values to generate
 * unique visitorKeys and bypass the 24-hour deduplication window.
 */
export function getForwardedIp(headers: Headers): string | null {
    const realIp = headers.get("x-real-ip")?.trim() || null;

    // If the direct upstream is a private proxy, the x-forwarded-for chain was
    // set by trusted infrastructure and the first entry is the real client IP.
    if (realIp && isPrivateIp(realIp)) {
        const forwardedFor = headers.get("x-forwarded-for");
        if (forwardedFor) {
            const first = forwardedFor.split(",")[0]?.trim();
            if (first) return first;
        }
    }

    // Fall back to x-real-ip (set by Vercel/nginx, not spoofable by clients).
    return realIp;
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
