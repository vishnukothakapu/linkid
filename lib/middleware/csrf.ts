import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
    CSRF_COOKIE_NAME,
    extractCsrfTokenFromRequest,
    validateCsrfToken,
} from "@/lib/csrf";

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXCLUDED_PATH_PREFIXES = [
    "/api/auth",
    "/api/csrf",
    "/api/links/click",
    "/api/analytics/aggregate",
];

export type CsrfDecision = "skip" | "allow" | "reject";

/**
 * Decides whether a request should be protected by CSRF validation.
 */
export function getCsrfDecision(input: {
    method: string;
    pathname: string;
    requestToken: string | null | undefined;
    storedToken: string | null | undefined;
}): CsrfDecision {
    const { method, pathname, requestToken, storedToken } = input;

    if (
        !CSRF_PROTECTED_METHODS.has(method) ||
        CSRF_EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
        return "skip";
    }

    return validateCsrfToken(requestToken, storedToken) ? "allow" : "reject";
}

/**
 * Applies CSRF validation to a middleware request and returns a rejection response when needed.
 */
export async function applyCsrfProtection(request: NextRequest): Promise<NextResponse | null> {
    const requestToken = await extractCsrfTokenFromRequest(request);
    const storedToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const decision = getCsrfDecision({
        method: request.method,
        pathname: request.nextUrl.pathname,
        requestToken,
        storedToken,
    });

    if (decision !== "reject") {
        return null;
    }

    console.warn("CSRF validation failed", {
        method: request.method,
        route: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
    );
}
