/**
 * __tests__/middleware/csrf.test.ts
 *
 * Unit tests for lib/middleware/csrf.ts — the CSRF protection middleware.
 *
 * The middleware is imported as a pure function and tested in isolation.
 * No real HTTP server is started.
 */

import { applyCsrfProtection } from "@/lib/middleware/csrf";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, { method, headers });
}

// ---------------------------------------------------------------------------
// Safe methods (GET, HEAD, OPTIONS) — should always pass through
// ---------------------------------------------------------------------------
describe("applyCsrfProtection() — safe HTTP methods", () => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  safeMethods.forEach((method) => {
    it(`allows ${method} requests without a CSRF token`, async () => {
      const req = buildRequest(method, "https://linkid.qzz.io/api/links");
      const result = await applyCsrfProtection(req);
      // Safe methods should return null (pass-through) or a NextResponse.next()
      expect(result === null || result instanceof NextResponse).toBe(true);
      if (result instanceof NextResponse) {
        expect(result.status).toBeLessThan(400);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Unsafe methods (POST, PUT, PATCH, DELETE) — require CSRF token
// ---------------------------------------------------------------------------
describe("applyCsrfProtection() — unsafe HTTP methods without CSRF token", () => {
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  unsafeMethods.forEach((method) => {
    it(`blocks a ${method} request with no CSRF headers`, async () => {
      const req = buildRequest(method, "https://linkid.qzz.io/api/links");
      const result = await applyCsrfProtection(req);
      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(403);
    });
  });
});

// ---------------------------------------------------------------------------
// Vercel/browser sends Origin header — validate it matches the expected host
// ---------------------------------------------------------------------------
describe("applyCsrfProtection() — token-based decisions", () => {
  it("rejects protected method when request token is missing", async () => {
    const req = buildRequest("POST", "https://linkid.qzz.io/api/links");
    const result = await applyCsrfProtection(req);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Does not throw on malformed input
// ---------------------------------------------------------------------------
describe("applyCsrfProtection() — robustness", () => {
  it("does not throw when the URL is a plain API route", async () => {
    const req = buildRequest("POST", "https://linkid.qzz.io/api/auth/session");
    const result = await applyCsrfProtection(req);
    expect(result).toBeNull();
  });
});