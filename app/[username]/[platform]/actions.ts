"use server";

import { createHash, timingSafeEqual } from "node:crypto";

import prisma from "@/lib/prisma";
import { trackLinkClick } from "@/lib/analytics";
import { headers } from "next/headers";
import { getMobileOS, getDeepLink } from "@/lib/deeplink";
import { isSafeRedirectUrl } from "@/lib/urlValidation";
import { checkRateLimit } from "@/lib/rateLimit";

// A 4-6 digit PIN is brute forceable without throttling; 5 attempts per client
// per link per 15 minutes leaves room for typos while making enumeration
// impractical. The per-link budget is a coarse backstop against distributed
// attempts from many addresses.
const PIN_ATTEMPT_LIMIT = 5;
const PIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const PIN_LINK_ATTEMPT_LIMIT = 50;

const ANDROID_PACKAGES: Record<string, string> = {
    instagram: "com.instagram.android",
    youtube: "com.google.android.youtube",
    x: "com.twitter.android",
    twitter: "com.twitter.android",
    linkedin: "com.linkedin.android",
    facebook: "com.facebook.katana",
    twitch: "tv.twitch.android.app",
};

/**
 * Constant-time comparison of two PINs. Both sides are hashed first so the
 * inputs always have the same length (timingSafeEqual throws otherwise).
 */
function pinsMatch(expected: string, provided: string): boolean {
    const expectedDigest = createHash("sha256").update(expected).digest();
    const providedDigest = createHash("sha256").update(provided).digest();
    return timingSafeEqual(expectedDigest, providedDigest);
}

export async function verifyPinAction(linkId: string, pinCode: string) {
    if (typeof linkId !== "string" || typeof pinCode !== "string") {
        return { error: "Incorrect PIN" };
    }

    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for");
    const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : requestHeaders.get("x-real-ip") ?? "unknown";

    const clientAllowed = await checkRateLimit(
        `pin-verify:${ip}:${linkId}`,
        PIN_ATTEMPT_LIMIT,
        PIN_ATTEMPT_WINDOW_MS
    );
    if (!clientAllowed) {
        return { error: "Too many attempts. Please try again later." };
    }

    const linkAllowed = await checkRateLimit(
        `pin-verify-link:${linkId}`,
        PIN_LINK_ATTEMPT_LIMIT,
        PIN_ATTEMPT_WINDOW_MS
    );
    if (!linkAllowed) {
        return { error: "Too many attempts. Please try again later." };
    }

    const link = await prisma.link.findUnique({ where: { id: linkId } });

    const now = new Date();
    const withinSchedule =
        (!link?.startDate || new Date(link.startDate) <= now) &&
        (!link?.endDate || new Date(link.endDate) >= now);

    // Wrong PIN, missing PIN, non-public link and out-of-window links all fail
    // identically so the action cannot be used as a visibility oracle.
    if (
        !link ||
        !link.pinCode ||
        !link.isPublic ||
        !withinSchedule ||
        !pinsMatch(link.pinCode, pinCode)
    ) {
        return { error: "Incorrect PIN" };
    }

    if (!isSafeRedirectUrl(link.url)) {
        return { error: "Invalid redirect URL" };
    }

    await trackLinkClick({
        linkId: link.id,
        workspaceId: link.workspaceId,
        headers: requestHeaders,
    });

    const userAgent = requestHeaders.get("user-agent") ?? "";
    const os = getMobileOS(userAgent);
    const webUrl = link.url;
    let appUrl = null;
    let isDeepLink = false;

    if (os !== "unknown") {
        const actualPlatform = link.platform;
        const deepLinks = getDeepLink(actualPlatform, webUrl);
        appUrl = os === "android" ? deepLinks.android : deepLinks.ios;

        if (appUrl) {
            const isInApp = /FBAN|FBAV|FBIOS|Instagram|Twitter|LinkedIn|TikTok|Snapchat/i.test(userAgent);
            if (os === "android" && isInApp) {
                const cleanUrl = webUrl.replace(/^https?:\/\//, "");
                const targetPackage = ANDROID_PACKAGES[actualPlatform];
                if (targetPackage) {
                    appUrl = `intent://${cleanUrl}#Intent;package=${targetPackage};scheme=https;end`;
                }
            }
            isDeepLink = true;
        }
    }

    return { success: true, webUrl, appUrl, isDeepLink, platform: link.platform };
}
