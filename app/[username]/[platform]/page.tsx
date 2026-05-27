import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { PlatformParams } from "../types/type";
import { trackLinkClick } from "@/lib/analytics";
import { resolveUserByUsername } from "@/lib/userLookup";
import { getMobileOS, getDeepLink } from "@/lib/deeplink";

export default async function PlatformRedirect({
    params,
}: {
    params: Promise<PlatformParams>;
}) {
    const { username, platform } = await params;
    const requestHeaders = await headers();

    const resolved = await resolveUserByUsername(username);
    if (!resolved) notFound();

    const link = await prisma.link.findFirst({
        where: {
            platform,
            userId: resolved.user.id,
            isPublic: true,
        },
        select: { id: true, url: true, userId: true },
    });

    if (!link) notFound();

    await trackLinkClick({
        linkId: link.id,
        userId: link.userId,
        headers: requestHeaders,
    });

    // --- Smart Intent Routing ---
    const userAgent = requestHeaders.get("user-agent") ?? "";
    const os = getMobileOS(userAgent);

    if (os !== "unknown") {
        const deepLinks = getDeepLink(platform, link.url);
        const appUrl = os === "android" ? deepLinks.android : deepLinks.ios;

        if (appUrl) {
            const webUrl = link.url;
            return (
                <html lang="en">
                    <head>
                        <title>Opening {platform}...</title>
                        <meta httpEquiv="refresh" content={`3;url=${webUrl}`} />
                        <meta name="robots" content="noindex" />
                        <style>{`
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
                            a { color: #888; font-size: 0.85rem; margin-top: 24px; }
                        `}</style>
                    </head>
                    <body>
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
                        <p>Opening {platform} app...</p>
                        <a href={webUrl}>Open in browser instead</a>
                    </body>
                </html>
            );
        }
    }

    // Desktop or no deep link available — plain redirect
    redirect(link.url);
}