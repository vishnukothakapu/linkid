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

const PLATFORM_PATTERNS: Record<Platform, RegExp> = {
    github: /^https?:\/\/(www\.)?github\.com\/[^/]+/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[^/]+/i,
    leetcode: /^https?:\/\/(www\.)?leetcode\.com\/[^/]+/i,
    youtube: /^https?:\/\/(www\.)?youtube\.com\/[^/]+/i,
    x: /^https?:\/\/(www\.)?x\.com\/[^/]+/i,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/[^/]+/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/[^/]+/i,
    discord: /^https?:\/\/(www\.)?discord\.com\/users\/[^/]+/i,
    twitch: /^https?:\/\/(www\.)?twitch\.tv\/[^/]+/i,
    hashnode: /^https?:\/\/([^/]+\.)?hashnode\.(com|dev)(\/[^/]+)?/i,
    devto: /^https?:\/\/(www\.)?dev\.to\/[^/]+/i,
    medium: /^https?:\/\/(www\.)?medium\.com\/@?[^/]+/i,
    dribbble: /^https?:\/\/(www\.)?dribbble\.com\/[^/]+/i,
    website: /^https?:\/\/.+/i,
};

export function normalizeUrl(url: string) {
    let u = url.trim();
    if (!/^https?:/i.test(u)) {
        u = "https://" + u;
    }
    return u.replace(/\/$/, "");
}

export function detectPlatform(url: string): Platform {
    const normalized = normalizeUrl(url);

    for (const [platform, regex] of Object.entries(PLATFORM_PATTERNS)) {
        if (regex.test(normalized)) {
            return platform as Platform;
        }
    }

    return "website";
}

export function validatePlatformUrl(
    platform: Platform,
    url: string
): boolean {
    const normalized = normalizeUrl(url);

    if (
        normalized.includes("/messaging/") ||
        normalized.includes("/feed/")
    ) {
        return false;
    }

    return PLATFORM_PATTERNS[platform].test(normalized);
}