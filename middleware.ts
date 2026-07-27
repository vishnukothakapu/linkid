import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { applyCsrfProtection } from "@/lib/middleware/csrf";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

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
    const isBaseDomain = host?.includes("linkid.qzz.io") || host?.includes(process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") || "");
    const isCustomDomain = host && !isLocal && !isBaseDomain;

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
      form-action 'self';
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
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
