import { NextResponse } from "next/server";

import {
    CSRF_COOKIE_NAME,
    generateCsrfToken,
    getCsrfCookieOptions,
} from "@/lib/csrf";

export async function GET() {
    const token = generateCsrfToken();
    const response = NextResponse.json(
        { token },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        }
    );

    response.cookies.set(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());

    return response;
}
