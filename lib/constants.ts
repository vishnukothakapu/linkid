export const PLATFORMS = {
    GITHUB: "github",
    LINKEDIN: "linkedin",
    TWITTER: "twitter",
    INSTAGRAM: "instagram",
    YOUTUBE: "youtube",
    FACEBOOK: "facebook",
    SNAPCHAT: "snapchat",
    TIKTOK: "tiktok",
    REDDIT: "reddit",
    MEDIUM: "medium",
    DEVTO: "devto",
    HASHNODE: "hashnode",
    WEBSITE: "website",
    OTHER: "other",
    GOOGLE: "google",
    X: "x",
    TWITCH: "twitch",
    DISCORD: "discord",
} as const;

export type PlatformKey = keyof typeof PLATFORMS;
export type PlatformValue = (typeof PLATFORMS)[PlatformKey];