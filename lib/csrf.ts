export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_MAX_AGE_SECONDS = 60 * 60;

export function generateCsrfToken(): string {
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error("Secure crypto API is unavailable");
    }

    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateCsrfToken(
    token: string | null | undefined,
    storedToken: string | null | undefined
): boolean {
    if (!token || !storedToken) {
        return false;
    }

    const encoder = new TextEncoder();
    const tokenBuffer = encoder.encode(token);
    const storedTokenBuffer = encoder.encode(storedToken);

    if (tokenBuffer.length !== storedTokenBuffer.length) {
        return false;
    }

    let mismatch = 0;

    for (let index = 0; index < tokenBuffer.length; index += 1) {
        mismatch |= tokenBuffer[index] ^ storedTokenBuffer[index];
    }

    return mismatch === 0;
}

export async function extractCsrfTokenFromRequest(request: Request): Promise<string | null> {
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (headerToken) {
        return headerToken;
    }

    const contentType = request.headers.get("content-type") ?? "";

    try {
        if (contentType.includes("application/json")) {
            const body = await request.clone().json() as { _csrf?: unknown };

            return typeof body._csrf === "string" ? body._csrf : null;
        }

        if (
            contentType.includes("application/x-www-form-urlencoded") ||
            contentType.includes("multipart/form-data")
        ) {
            const formData = await request.clone().formData();
            const formToken = formData.get("_csrf");

            return typeof formToken === "string" ? formToken : null;
        }
    } catch {
        return null;
    }

    return null;
}

export function getCsrfCookieOptions() {
    return {
        httpOnly: true,
        maxAge: CSRF_TOKEN_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "strict" as const,
        secure: process.env.NODE_ENV === "production",
    };
}
