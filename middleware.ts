import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { applyCsrfProtection } from "@/lib/middleware/csrf";

const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

const authRateLimit = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m") })
    : null;

const usernameRateLimit = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "1 m") })
    : null;

const linksRateLimit = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m") })
    : null;

const localFallbackMap = new Map<string, number>();
function checkLocalRateLimit(ip: string, limit: number): boolean {
    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `${ip}-${currentMinute}`;
    // Remove stale minute-bucket entries from localFallbackMap
    for (const k of localFallbackMap.keys()) {
        const parts = k.split("-");
        const minute = parseInt(parts[parts.length - 1], 10);
        if (minute < currentMinute) {
            localFallbackMap.delete(k);
        }
    }
    const current = localFallbackMap.get(key) || 0;
    if (current >= limit) return false;
    localFallbackMap.set(key, current + 1);
    return true;
}

function setVisitorCookie(response: NextResponse, visitorId: string, secure: boolean) {
    response.cookies.set("visitor_id", visitorId, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
        secure,
    });
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const cookieVisitorId = req.cookies.get("visitor_id")?.value;
    const visitorId = cookieVisitorId || crypto.randomUUID();

    // API routes: apply CSRF protection only. The rest of this middleware
    // (auth redirects, custom-domain rewrite, CSP nonce) is for page
    // navigations, not API calls. The matcher previously excluded /api
    // entirely, so applyCsrfProtection never ran on the mutating API routes.
    if (pathname.startsWith("/api")) {
        const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
        let isAllowed = true;

        if (pathname.startsWith("/api/auth")) {
            isAllowed = authRateLimit ? (await authRateLimit.limit(ip)).success : checkLocalRateLimit(`auth-${ip}`, 5);
        } else if (pathname.startsWith("/api/username")) {
            isAllowed = usernameRateLimit ? (await usernameRateLimit.limit(ip)).success : checkLocalRateLimit(`username-${ip}`, 15);
        } else if (pathname.startsWith("/api/links")) {
            isAllowed = linksRateLimit ? (await linksRateLimit.limit(ip)).success : checkLocalRateLimit(`links-${ip}`, 30);
        }

        if (!isAllowed) {
            return new NextResponse("Too Many Requests", { status: 429 });
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
        const headers = new Headers(req.headers);
        headers.set("x-visitor-id", visitorId);
        const response = NextResponse.rewrite(new URL(`/domain/${host}${pathname}`, req.url), {
            request: { headers }
        });
        if (!cookieVisitorId) {
            setVisitorCookie(response, visitorId, req.nextUrl.protocol === "https:");
        }
        return response;
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
    requestHeaders.set("x-visitor-id", visitorId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set("Content-Security-Policy", cspHeader);

    if (!cookieVisitorId) {
        setVisitorCookie(response, visitorId, req.nextUrl.protocol === "https:");
    }

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
