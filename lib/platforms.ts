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
    github:    /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?$/i,
    linkedin:  /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[A-Za-z0-9_-]+\/?$/i,
    leetcode:  /^https?:\/\/(www\.)?leetcode\.com\/u\/[A-Za-z0-9_-]+\/?$/i,
    youtube:   /^https?:\/\/(www\.)?youtube\.com\/(@[A-Za-z0-9_.-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+)\/?$/i,
    x:         /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,15}\/?$/i,
    facebook:  /^https?:\/\/(www\.)?facebook\.com\/(?!messaging|feed|groups|events)[A-Za-z0-9._-]+\/?$/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/i,
    discord:   /^https?:\/\/(www\.)?discord\.com\/users\/\d{17,20}\/?$/i,
    twitch:    /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]{4,25}\/?$/i,
    hashnode:  /^https?:\/\/([A-Za-z0-9_-]+\.hashnode\.(com|dev)|hashnode\.(com|dev)\/[A-Za-z0-9_@-]+)\/?$/i,
    devto:     /^https?:\/\/(www\.)?dev\.to\/[A-Za-z0-9_-]+\/?$/i,
    medium:    /^https?:\/\/(www\.)?medium\.com\/@[A-Za-z0-9_.-]+\/?$/i,
    dribbble:  /^https?:\/\/(www\.)?dribbble\.com\/[A-Za-z0-9_-]+\/?$/i,
    website:   /^https?:\/\/.+/i,
};

// Blocks that indicate non-profile/spam URLs for specific platforms
const PLATFORM_BLOCKLIST: Partial<Record<Platform, RegExp>> = {
    linkedin:  /\/(messaging|feed|jobs|notifications|search)\//i,
    facebook:  /\/(messaging|feed|groups|events|marketplace)\//i,
    youtube:   /\/(watch|playlist|shorts|results)\b/i,
    instagram: /\/(p|reel|explore|stories)\//i,
};

// ─── Deep Link Schemes ────────────────────────────────────────────────────────

export type DeepLinkResult = { android: string | null; ios: string | null };

/**
 * Maps a platform + web URL to native app URI schemes.
 * Returns null for platforms that don't support reliable deep linking.
 */
const DEEP_LINK_BUILDERS: Partial
    Record<Platform, (url: URL) => DeepLinkResult>
> = {
    instagram: (url) => {
        const username = url.pathname.replace(/^\/|\/$/g, "").split("/")[0];
        if (!username) return { android: null, ios: null };
        const scheme = `instagram://user?username=${username}`;
        return { android: scheme, ios: scheme };
    },

    youtube: (url) => {
        const videoId = url.searchParams.get("v");
        if (videoId) {
            const scheme = `vnd.youtube://${videoId}`;
            return { android: scheme, ios: scheme };
        }
        // Channel handle e.g. /@handle or /channel/ID
        const scheme = `vnd.youtube://www.youtube.com${url.pathname}`;
        return { android: scheme, ios: scheme };
    },

    x: (url) => {
        const handle = url.pathname.replace(/^\/|\/$/g, "").split("/")[0];
        if (!handle) return { android: null, ios: null };
        const scheme = `twitter://user?screen_name=${handle}`;
        return { android: scheme, ios: scheme };
    },

    twitch: (url) => {
        const channel = url.pathname.replace(/^\/|\/$/g, "").split("/")[0];
        if (!channel) return { android: null, ios: null };
        const scheme = `twitch://stream/${channel}`;
        return { android: scheme, ios: scheme };
    },

    linkedin: (url) => {
        const path = url.pathname; // e.g. /in/username
        return {
            // Android uses an intent URI
            android: `intent://linkedin.com${path}#Intent;package=com.linkedin.android;scheme=https;end`,
            ios: `linkedin://${path}`,
        };
    },

    facebook: (url) => {
        return {
            android: `fb://facewebmodal/f?href=${encodeURIComponent(url.href)}`,
            ios: `fb://profile`,
        };
    },
};

// ─── Exported Utilities ───────────────────────────────────────────────────────

export function normalizeUrl(url: string): string {
    let u = url.trim();
    if (!/^https?:/i.test(u)) u = "https://" + u;
    return u.replace(/\/$/, "");
}

export function detectPlatform(url: string): Platform {
    const normalized = normalizeUrl(url);

    for (const [platform, regex] of Object.entries(PLATFORM_PATTERNS)) {
        // Skip the catch-all until the end
        if (platform === "website") continue;
        if (regex.test(normalized)) return platform as Platform;
    }

    return "website";
}

export function validatePlatformUrl(platform: Platform, url: string): boolean {
    const normalized = normalizeUrl(url);

    const blocklist = PLATFORM_BLOCKLIST[platform];
    if (blocklist?.test(normalized)) return false;

    return PLATFORM_PATTERNS[platform].test(normalized);
}

/**
 * Detects Android / iOS from a User-Agent string.
 */
export function getMobileOS(
    userAgent: string
): "android" | "ios" | "unknown" {
    if (/android/i.test(userAgent)) return "android";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
    return "unknown";
}

/**
 * Returns native app URI schemes for a platform + web URL.
 * Returns `{ android: null, ios: null }` for unsupported platforms.
 */
export function getDeepLink(platform: string, webUrl: string): DeepLinkResult {
    const builder = DEEP_LINK_BUILDERS[platform as Platform];
    if (!builder) return { android: null, ios: null };

    try {
        return builder(new URL(webUrl));
    } catch {
        return { android: null, ios: null };
    }
}