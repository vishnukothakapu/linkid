import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
    CSRF_COOKIE_NAME,
    extractCsrfTokenFromRequest,
    validateCsrfToken,
} from "@/lib/csrf";

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXCLUDED_PATHS = [
    "/api/auth",
    "/api/csrf",
    "/api/contact-us",
    "/api/links/click",
    "/api/analytics/aggregate",
];

export type CsrfDecision = "skip" | "allow" | "reject";

/**
 * Helper to ensure an exact path match or strict path-segment boundary matching.
 * This prevents partial matching vulnerabilities (e.g., /api/contact-us-admin).
 */
function matchesExcludedPrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getCsrfDecision(input: {
    method: string;
    pathname: string;
    requestToken: string | null | undefined;
    storedToken: string | null | undefined;
}): CsrfDecision {
    const { method, pathname, requestToken, storedToken } = input;

    if (
        !CSRF_PROTECTED_METHODS.has(method) ||
        CSRF_EXCLUDED_PATHS.some((prefix) => matchesExcludedPrefix(pathname, prefix))
    ) {
        return "skip";
    }

    return validateCsrfToken(requestToken, storedToken) ? "allow" : "reject";
}

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