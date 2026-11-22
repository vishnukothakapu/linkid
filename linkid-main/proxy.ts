import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { applyCsrfProtection } from "@/lib/middleware/csrf";
import { checkRateLimit } from "@/lib/rateLimit";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // API routes: apply CSRF protection and specific endpoint rate limiting.
    if (pathname.startsWith("/api")) {
        // Enforce credentials login rate limit: 5 requests per minute per client IP.
        // Other /api/auth routes and route-level protected endpoints (/api/username, /api/links)
        // are not rate-limited here.
        if (pathname.startsWith("/api/auth/callback/credentials")) {
            const rawForwarded = req.headers.get("x-forwarded-for");
            const ip = rawForwarded ? rawForwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "127.0.0.1";

            try {
                const allowed = await checkRateLimit(`auth-credentials:${ip}`, 5, 60_000);
                if (!allowed) {
                    return new NextResponse("Too Many Requests", {
                        status: 429,
                        headers: {
                            "Retry-After": "60",
                            "X-RateLimit-Limit": "5",
                            "X-RateLimit-Remaining": "0",
                        },
                    });
                }
            } catch (error) {
                console.error("Rate limit check failed (bypassing):", error);
            }
        }

        const csrfResponse = await applyCsrfProtection(req);
        return csrfResponse ?? NextResponse.next();
    }

    const token = await getToken({ req });

    // If logged in & trying to access /login or /register → redirect to dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If NOT logged in & trying to access /dashboard → redirect to login (#398)
    if (!token && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const host = req.headers.get("host");
    const isLocal = host?.includes("localhost") || host?.includes("127.0.0.1");
    // Exact host match — the previous `includes(...)` collapsed to `includes("")`
    // (always true) when NEXT_PUBLIC_APP_URL was unset, so custom domains were
    // never detected.
    const appHost = process.env.NEXT_PUBLIC_APP_URL
        ?.replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
    const baseHosts = ["linkid.qzz.io", appHost].filter(Boolean) as string[];
    const isBaseDomain = !!host && baseHosts.some((h) => host === h || host.endsWith(`.${h}`));
    const isCustomDomain = !!host && !isLocal && !isBaseDomain;

    if (isCustomDomain) {
        // Rewrite to a special domain handler route that will fetch the user by domain
        return NextResponse.rewrite(new URL(`/domain/${host}${pathname}`, req.url));
    }

    const csrfResponse = await applyCsrfProtection(req);

    if (csrfResponse) {
        return csrfResponse;
    }

    const nonce = crypto.randomUUID();
    const isDev = process.env.NODE_ENV === "development";
    
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://accounts.google.com https://github.com;
      frame-ancestors 'none';
      connect-src 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, " ").trim();

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         *
         * /api is intentionally included so CSRF protection runs on API
         * routes; the handler short-circuits API requests to CSRF only.
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
