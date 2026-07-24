// app/[username]/[platform]/page.tsx

import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { PlatformParams } from "../types/type";
import { trackLinkClick } from "@/lib/analytics";
import { resolveUserByUsername } from "@/lib/userLookup";
// ✨ Fixed: Correct module reference target mapping
import { getMobileOS, getDeepLink } from "@/lib/deeplink";
import { isSafeRedirectUrl } from "@/lib/urlValidation";

// ✨ Platform package registry mapping fallback for Android Intents
const ANDROID_PACKAGES: Record<string, string> = {
    instagram: "com.instagram.android",
    youtube: "com.google.android.youtube",
    x: "com.twitter.android",
    twitter: "com.twitter.android",
    linkedin: "com.linkedin.android",
    facebook: "com.facebook.katana",
    twitch: "tv.twitch.android.app",
};

// Next.js Native Metadata Configuration Override for Dynamic Routing 
export async function generateMetadata({ params }: { params: Promise<PlatformParams> }) {
    const { platform } = await params;
    return {
        title: `Opening ${platform.toUpperCase()}...`,
        robots: "noindex, nofollow",
    };
}

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<PlatformParams>;
}) {
    const { username, platform } = await params;
    const requestHeaders = await headers();

    // ✨ Fixed: Case sensitivity loophole handled using explicit lowercasing bounds
    const normalizedPlatform = platform.toLowerCase();

    const resolved = await resolveUserByUsername(username);
    if (!resolved) notFound();

    const link = await prisma.link.findFirst({
        where: {
            userId: resolved.user.id,
            isPublic: true,
            OR: [
                { alias: normalizedPlatform },
                { platform: normalizedPlatform, alias: null }
            ]
        },
        select: { id: true, url: true, userId: true, platform: true },
    });

    if (!link) notFound();

    // Revalidate the redirect target's scheme even though it was already
    // checked when the link was created or updated. `link.url` below is
    // rendered into a `<meta http-equiv="refresh">` tag, an inline script,
    // an `<a href>`, and passed to `redirect()` — a `javascript:`, `data:`,
    // or otherwise non-http(s) value must never reach any of those sinks.
    if (!isSafeRedirectUrl(link.url)) {
        notFound();
    }

    // Track analytics asynchronously safely
    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
        headers: requestHeaders,
    });

    // ─── Smart Intent & Mobile Routing Matrix ─────────────────────────────────
    const userAgent = requestHeaders.get("user-agent") ?? "";
    const os = getMobileOS(userAgent);
    const webUrl = link.url;

    if (os !== "unknown") {
        const actualPlatform = link.platform;
        const deepLinks = getDeepLink(actualPlatform, webUrl);
        let appUrl = os === "android" ? deepLinks.android : deepLinks.ios;

        if (appUrl) {
            // ✨ Fixed: Expanded in-app browser pattern checks matching your code fixes
            const isInApp = /FBAN|FBAV|FBIOS|Instagram|Twitter|LinkedIn|TikTok|Snapchat/i.test(userAgent);
            
            if (os === "android" && isInApp) {
                const cleanUrl = webUrl.replace(/^https?:\/\//, "");
                const targetPackage = ANDROID_PACKAGES[actualPlatform];
                
                // ✨ Fixed: Safe registry mapping check to skip wrong fake package layouts
                if (targetPackage) {
                    appUrl = `intent://${cleanUrl}#Intent;package=${targetPackage};scheme=https;end`;
                }
            }

            // Return interstitial HTML page payload to fire deep links natively
            return (
                <div className="redirect-container">
                    <meta httpEquiv="refresh" content={`3;url=${webUrl}`} />
                    
                    {/* Safe CSS Injection without hydration breakdown issues */}
                    <style dangerouslySetInnerHTML={{ __html: `
                        body {
                            font-family: sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #0a0a0a;
                            color: #e5e5e5;
                        }
                        p { font-size: 1rem; color: #888; margin-top: 12px; }
                        a { color: #888; font-size: 0.85rem; margin-top: 24px; text-decoration: none; border-bottom: 1px dashed #555; }
                    `}} />
                    
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function () {
                                    var appUrl = ${JSON.stringify(appUrl)};
                                    var webUrl = ${JSON.stringify(webUrl)};
                                    var timer = setTimeout(function () {
                                        window.location.replace(webUrl);
                                    }, 2000);
                                    window.addEventListener("visibilitychange", function () {
                                        if (document.hidden) clearTimeout(timer);
                                    });
                                    window.location.href = appUrl;
                                })();
                            `,
                        }}
                    />
                    <p>Opening {actualPlatform} app...</p>
                    <a href={webUrl}>Open in browser instead</a>
                </div>
            );
        }
    }

    return redirect(webUrl);
}
