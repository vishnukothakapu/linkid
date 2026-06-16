// Lib/platforms.ts

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
    | "website";

// ─── URL Validation Patterns ─────────────────────────────────────────────────

const PLATFORM_PATTERNS: Record<Platform, RegExp> = {
    github:     /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?(\?.*)?$/i,

    // Tightened to only allow public profile paths: /in/username, /company/name, /school/name, /pub/username
    linkedin:   /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school|pub)\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,

    leetcode:   /^https?:\/\/(www\.)?leetcode\.com\/u\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    youtube:    /^https?:\/\/(www\.)?(youtube\.com\/(@[A-Za-z0-9_.-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+|shorts\/[A-Za-z0-9_-]+|watch|playlist)|youtu\.be\/[A-Za-z0-9_-]+\/?)\/?(\?.*)?$/i,
    x:          /^https?:\/\/(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?(\?.*)?$/i,

    // Tightened to only allow profile.php?id= (checked first) or public usernames.
    // profile.php?id=\d+ is listed before the username branch so the lookbehind
    // never has a chance to misfire on the bare "profile.php" string.
    facebook:   /^https?:\/\/(www\.)?facebook\.com\/(profile\.php\?id=\d+|(?!(?:gaming|watch|business|marketplace|groups|events|pages|help|policies|legal|about|login|checkpoint|messages)(?=[/?]|$))[A-Za-z0-9._-]{1,50})\/?(\?.*)?$/i,

    instagram:  /^https?:\/\/(www\.)?instagram\.com\/(?:[A-Za-z0-9._]{1,30}|p\/[A-Za-z0-9_-]+|reel\/[A-Za-z0-9_-]+|reels\/[A-Za-z0-9_-]+)\/?(\?.*)?$/i,
    discord:    /^https?:\/\/(www\.)?discord\.com\/(users\/\d{17,20}|invite\/[A-Za-z0-9_-]+)\/?(\?.*)?$/i,
    twitch:     /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]{4,25}\/?(\?.*)?$/i,
    hashnode:   /^https?:\/\/([A-Za-z0-9_-]+\.hashnode\.(com|dev)|hashnode\.(com|dev)\/[A-Za-z0-9_@-]+)\/?(\?.*)?$/i,
    devto:      /^https?:\/\/(www\.)?dev\.to\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    medium:     /^https?:\/\/(www\.)?medium\.com\/@[A-Za-z0-9_.-]+\/?(\?.*)?$/i,
    dribbble:   /^https?:\/\/(www\.)?dribbble\.com\/[A-Za-z0-9_-]+\/?(\?.*)?$/i,
    website:    /^https?:\/\/.+/i,
};

// ─── Platform Blocklists ─────────────────────────────────────────────────────
// Defence-in-depth: catches internal app views even if the main pattern is ever loosened.
const PLATFORM_BLOCKLIST: Partial<Record<Platform, RegExp>> = {
    // LinkedIn blocklist is kept as defence-in-depth even though the tightened
    // pattern above already rejects anything outside /in|company|school|pub/.
    linkedin:  /\/(messaging|feed|jobs|notifications|search|mynetwork|learning|checkpoint|sales)(?=[/?]|$)/i,
    // Facebook blocklist uses (?=[/?]|$) instead of \b so trailing slashes are caught too.
    facebook:  /\/(messaging|messages|feed|groups|events|marketplace|gaming|watch|business|pages|help|policies|legal|about|login|checkpoint)(?=[/?]|$)|\/profile\.php(?!\?id=\d)/i,
    youtube:   /\/results\b/i,
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
        if (platform === "website") continue;
        if (regex.test(normalized)) return platform;
    }

    return "website";
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