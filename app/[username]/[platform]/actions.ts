"use server";

import prisma from "@/lib/prisma";
import { trackLinkClick } from "@/lib/analytics";
import { headers } from "next/headers";
import { getMobileOS, getDeepLink } from "@/lib/deeplink";
import { isSafeRedirectUrl } from "@/lib/urlValidation";

const ANDROID_PACKAGES: Record<string, string> = {
    instagram: "com.instagram.android",
    youtube: "com.google.android.youtube",
    x: "com.twitter.android",
    twitter: "com.twitter.android",
    linkedin: "com.linkedin.android",
    facebook: "com.facebook.katana",
    twitch: "tv.twitch.android.app",
};

export async function verifyPinAction(linkId: string, pinCode: string) {
    const link = await prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.pinCode !== pinCode) {
        return { error: "Incorrect PIN" };
    }

    if (!isSafeRedirectUrl(link.url)) {
        return { error: "Invalid redirect URL" };
    }

    const requestHeaders = await headers();
    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
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
