import { PLATFORM_ICONS } from "@/lib/platformIcons";

export const formatLabel = (key: string) => {
    const exceptions: Record<string, string> = {
        github: "GitHub",
        linkedin: "LinkedIn",
        x: "X (Twitter)",
        youtube: "YouTube",
        leetcode: "LeetCode",
        devto: "Dev.to",
        codeforces: "Codeforces",
        codechef: "CodeChef",

    };
    return exceptions[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

export const POPULAR_PLATFORMS = [
    ...Object.keys(PLATFORM_ICONS)
        .filter((key) => key !== "website" && key !== "portfolio")
        .map((key) => ({ value: key, label: formatLabel(key) })),
    { value: "website", label: "Personal Website / Other" },
];
