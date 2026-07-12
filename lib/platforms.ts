// Lib/platforms.ts

import { PLATFORMS } from "@/lib/constants";

export type Platform =
    | "github"
    | "linkedin"
    | "leetcode"
    | "youtube"
    | "x"
    | "facebook"
    | "instagram"
    | "discord"
    | "twitch"
    | "hashnode"
    | "devto"
    | "medium"
    | "dribbble"
    | "codeforces"
    | "codechef"
    | "website";


// ─── URL Validation Patterns ─────────────────────────────────────────────────

const PLATFORM_PATTERNS: Record<Platform, RegExp> = {
    github: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?github\.com\/[A-Za-z0-9_.-]+\/?(\?.*)?$/i,

    // Catch-all domain suffixes force immediate platform identification for paths like /feed or /jobs,
    // stopping links from bypassing validation filters as generic website URLs.
    linkedin: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?linkedin\.com\/.*$/i,

    leetcode: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?leetcode\.com\/(u\/)?[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    youtube: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?(youtube\.com\/(@[A-Za-z0-9_.-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+|shorts\/[A-Za-z0-9_-]+|watch|playlist)|youtu\.be\/[A-Za-z0-9_-]+\/?)\/?(\?.*)?$/i,
    x: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?(\?.*)?$/i,

    // Generic domain catching ensures subpaths like /groups or /marketplace map to Facebook before validation.
    facebook: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?facebook\.com\/.*$/i,

    instagram: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?instagram\.com\/(?:[A-Za-z0-9._]{1,30}|p\/[A-Za-z0-9_-]+|reel\/[A-Za-z0-9_-]+|reels\/[A-Za-z0-9_-]+)\/?(\?.*)?$/i,
    discord: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?discord\.com\/(users\/\d+|invite\/[A-Za-z0-9_-]+)\/?(\?.*)?$/i,
    twitch: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?twitch\.tv\/[A-Za-z0-9_]{4,25}\/?(\?.*)?$/i,
    hashnode: /^https?:\/\/([A-Za-z0-9_-]+\.hashnode\.(com|dev)|hashnode\.(com|dev)\/[A-Za-z0-9_@-]+)\/?(\?.*)?$/i,
    devto: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?dev\.to\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    medium: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?medium\.com\/@?[A-Za-z0-9_.-]+\/?(\?.*)?$/i,
    dribbble: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?dribbble\.com\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    codechef: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?codechef\.com\/users\/[A-Za-z0-9_.-]+\/?(\?.*)?$/i,
    codeforces: /^https?:\/\/([a-zA-Z0-9_.-]+\.)?codeforces\.com\/profile\/[A-Za-z0-9_.-]+\/?(\?.*)?$/i,
    website: /^https?:\/\/.+/i,
};

// ─── Platform Blocklists ─────────────────────────────────────────────────────
// Defence-in-depth: catches internal app views even if the main pattern is ever loosened.
const PLATFORM_BLOCKLIST: Partial<Record<Platform, RegExp>> = {
    linkedin: /\/(messaging|feed|jobs|notifications|search)\b/i,
    facebook: /\/(messaging|feed|groups|events|marketplace)\b/i,
    youtube: /\/results\b/i,
    instagram: /\/(explore|stories)\b/i,
};

export type DeepLinkResult = { android: string | null; ios: string | null };

// ─── Exported Utilities ───────────────────────────────────────────────────────

/**
 * Normalizes input strings into a consistent URL format by ensuring protocols
 * and removing dangling trailing slashes.
 */
export function normalizeUrl(url: string): string {
    let u = url.trim();
    if (!/^https?:/i.test(u)) u = "https://" + u;

    try {
        const parsed = new URL(u);
        let path = parsed.pathname;
        if (path.length > 1 && path.endsWith("/")) {
            path = path.slice(0, -1);
        }
        return `${parsed.protocol}//${parsed.hostname}${path}${parsed.search}`;
    } catch {
        return u.replace(/\/$/, "");
    }
}

/**
 * Evaluates standard regex platform rules to classify which ecosystem the URL belongs to.
 */
export function detectPlatform(url: string): Platform {
    const normalized = normalizeUrl(url);

    for (const [platform, regex] of Object.entries(PLATFORM_PATTERNS) as [Platform, RegExp][]) {
        if (platform === PLATFORMS.WEBSITE) continue;
        if (regex.test(normalized)) return platform;
    }

    return PLATFORMS.WEBSITE;
}

export function isKnownPlatform(p: string): p is Platform {
    return Object.prototype.hasOwnProperty.call(PLATFORM_PATTERNS, p);
}

export function validatePlatformUrl(
    platform: Platform,
    url: string
): boolean {
    const normalized = normalizeUrl(url);
    const targetPlatform = platform.toLowerCase() as Platform;

    if (/\/(messaging|feed)\b/i.test(normalized)) return false;

    const pattern = PLATFORM_PATTERNS[targetPlatform];
    if (!pattern || !pattern.test(normalized)) return false;

    const blocklist = PLATFORM_BLOCKLIST[targetPlatform];
    if (blocklist?.test(normalized)) return false;

    return true;
}

/**
 * Inspects system request strings to identify incoming mobile architectures.
 */
export function getMobileOS(userAgent: string): "android" | "ios" | "unknown" {
    if (/android/i.test(userAgent)) return "android";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
    return "unknown";
}

// Lazy-loaded import helper to resolve native deep-link schemes without code duplication
import { getDeepLink as resolveDeepLink } from "./deeplink";

/**
 * Maps standard network addresses into custom deep link application tracking URIs.
 */
export function getDeepLink(platform: string, webUrl: string): DeepLinkResult {
    return resolveDeepLink(platform, webUrl);
}

export function slugifyPlatform(label: string | null | undefined): string {
    if (!label) return "";
    return label
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}