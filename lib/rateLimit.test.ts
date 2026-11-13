import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { checkRateLimit, rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { proxy } from "@/proxy";

test("Global Rate Limit Reset Vulnerability check", async () => {
    // Ensure we are testing the in-memory backend by having UPSTASH_REDIS env variables unset
    const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
    const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    try {
        const longWindowKey = "test:endpointA:1.2.3.4";
        const shortWindowKey = "test:endpointB:1.2.3.4";

        const longWindowMs = 24 * 60 * 60 * 1000; // 24 hours
        const shortWindowMs = 60000; // 1 minute

        // 1. Consume rate limit on longWindowKey (limit = 2)
        const allowed1 = await checkRateLimit(longWindowKey, 2, longWindowMs);
        const allowed2 = await checkRateLimit(longWindowKey, 2, longWindowMs);
        const allowed3 = await checkRateLimit(longWindowKey, 2, longWindowMs);

        assert.equal(allowed1, true, "First request to long window should be allowed");
        assert.equal(allowed2, true, "Second request to long window should be allowed");
        assert.equal(allowed3, false, "Third request to long window should be blocked");

        // 2. Make 500 requests to shortWindowKey to trigger sweepExpiredKeys()
        // since CLEANUP_INTERVAL is 500.
        for (let i = 0; i < 500; i++) {
            await checkRateLimit(shortWindowKey, 1000, shortWindowMs);
        }

        // 3. Verify that the rate limit for longWindowKey has NOT been reset/swept away
        const allowedAfterSweep = await checkRateLimit(longWindowKey, 2, longWindowMs);
        assert.equal(allowedAfterSweep, false, "Long window request should still be blocked after sweep");
    } finally {
        // Restore environment variables
        if (oldUrl) process.env.UPSTASH_REDIS_REST_URL = oldUrl;
        if (oldToken) process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
    }
});

test("Username endpoints rate limit: 10 requests per minute per client IP", async () => {
    const ip = "192.0.2.10";
    const otherIp = "192.0.2.20";
    const windowMs = 60_000;
    const limit = 10;

    // 1. Test /api/username/check limit
    for (let i = 1; i <= limit; i++) {
        const allowed = await checkRateLimit(`username-check:${ip}`, limit, windowMs);
        assert.equal(allowed, true, `username-check request #${i} should be allowed`);
    }
    const checkBlocked = await checkRateLimit(`username-check:${ip}`, limit, windowMs);
    assert.equal(checkBlocked, false, "username-check request #11 should be blocked");

    // Other IP is not affected
    const checkOtherAllowed = await checkRateLimit(`username-check:${otherIp}`, limit, windowMs);
    assert.equal(checkOtherAllowed, true, "username-check from different IP should be allowed");

    // 2. Test /api/username/create limit
    for (let i = 1; i <= limit; i++) {
        const allowed = await checkRateLimit(`username-create:${ip}`, limit, windowMs);
        assert.equal(allowed, true, `username-create request #${i} should be allowed`);
    }
    const createBlocked = await checkRateLimit(`username-create:${ip}`, limit, windowMs);
    assert.equal(createBlocked, false, "username-create request #11 should be blocked");

    // Other IP is not affected
    const createOtherAllowed = await checkRateLimit(`username-create:${otherIp}`, limit, windowMs);
    assert.equal(createOtherAllowed, true, "username-create from different IP should be allowed");
});

test("Link mutations: shared limit of 30 requests per minute across POST, PUT, DELETE per user", async () => {
    const userId = "user-mutation-test";
    const otherUserId = "user-mutation-other";
    const windowMs = 60_000;
    const limit = 30;
    const key = `link-mutate:${userId}`;

    // Simulate 10 POST requests
    for (let i = 1; i <= 10; i++) {
        const allowed = await checkRateLimit(key, limit, windowMs);
        assert.equal(allowed, true, `POST mutation #${i} should be allowed`);
    }

    // Simulate 10 PUT requests
    for (let i = 11; i <= 20; i++) {
        const allowed = await checkRateLimit(key, limit, windowMs);
        assert.equal(allowed, true, `PUT mutation #${i} should be allowed`);
    }

    // Simulate 10 DELETE requests
    for (let i = 21; i <= 30; i++) {
        const allowed = await checkRateLimit(key, limit, windowMs);
        assert.equal(allowed, true, `DELETE mutation #${i} should be allowed`);
    }

    // Request #31 must be blocked regardless of HTTP method
    const postBlocked = await checkRateLimit(key, limit, windowMs);
    assert.equal(postBlocked, false, "Mutation #31 (POST) should be blocked");

    const putBlocked = await checkRateLimit(key, limit, windowMs);
    assert.equal(putBlocked, false, "Mutation #32 (PUT) should be blocked");

    const deleteBlocked = await checkRateLimit(key, limit, windowMs);
    assert.equal(deleteBlocked, false, "Mutation #33 (DELETE) should be blocked");

    // Other user is not affected and has their full quota
    const otherAllowed = await checkRateLimit(`link-mutate:${otherUserId}`, limit, windowMs);
    assert.equal(otherAllowed, true, "Different user should have their own allowance");
});

test("Credentials login rate limit: 5 requests per minute per IP on /api/auth/callback/credentials", async () => {
    const ip = "198.51.100.50";
    const otherIp = "198.51.100.51";
    const limit = 5;
    const windowMs = 60_000;
    const key = `auth-credentials:${ip}`;

    for (let i = 1; i <= limit; i++) {
        const allowed = await checkRateLimit(key, limit, windowMs);
        assert.equal(allowed, true, `Credentials attempt #${i} should be allowed`);
    }

    const blocked = await checkRateLimit(key, limit, windowMs);
    assert.equal(blocked, false, "Credentials attempt #6 should be blocked");

    const otherAllowed = await checkRateLimit(`auth-credentials:${otherIp}`, limit, windowMs);
    assert.equal(otherAllowed, true, "Credentials attempt from different IP should be allowed");
});

test("Rate-limit responses: status 429, Retry-After header, and response formatting", async () => {
    const limit = 10;
    const windowMs = 60_000;

    const res = rateLimitResponse(limit, windowMs, {
        available: false,
        error: "Too many requests. Please try again later.",
    });

    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "60");
    assert.equal(res.headers.get("x-ratelimit-limit"), "10");
    assert.equal(res.headers.get("x-ratelimit-remaining"), "0");

    const json = await res.json();
    assert.deepEqual(json, {
        available: false,
        error: "Too many requests. Please try again later.",
    });

    // Test middleware helper rateLimit()
    const limiter = rateLimit(1, 60_000);
    const req1 = new NextRequest("http://localhost/api/test", {
        headers: { "x-forwarded-for": "203.0.113.99" },
    });
    const req2 = new NextRequest("http://localhost/api/test", {
        headers: { "x-forwarded-for": "203.0.113.99" },
    });

    const allowed = await limiter(req1);
    assert.equal(allowed, null, "First request to middleware should be allowed (null)");

    const blocked = await limiter(req2);
    assert.ok(blocked, "Second request to middleware should be blocked");
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "60");
    assert.equal(blocked.headers.get("x-ratelimit-limit"), "1");
    assert.equal(blocked.headers.get("x-ratelimit-remaining"), "0");
});

test("Proxy: enforces credentials callback limit without blocking other /api/auth routes or /api/username", async () => {
    const ip = "203.0.113.200";

    // 1. Credentials callback: 5 allowed, 6th blocked with 429 and Retry-After
    for (let i = 1; i <= 5; i++) {
        const req = new NextRequest("http://localhost/api/auth/callback/credentials", {
            method: "POST",
            headers: { "x-forwarded-for": ip },
        });
        const res = await proxy(req);
        assert.notEqual(res.status, 429, `Proxy credentials request #${i} should not be 429`);
    }

    const blockedReq = new NextRequest("http://localhost/api/auth/callback/credentials", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
    });
    const blockedRes = await proxy(blockedReq);
    assert.equal(blockedRes.status, 429, "Proxy credentials request #6 should be 429");
    assert.equal(blockedRes.headers.get("retry-after"), "60");
    assert.equal(blockedRes.headers.get("x-ratelimit-limit"), "5");
    assert.equal(blockedRes.headers.get("x-ratelimit-remaining"), "0");

    // 2. Other /api/auth routes from the SAME IP must NOT be blocked by the credentials limiter
    const sessionReq = new NextRequest("http://localhost/api/auth/session", {
        headers: { "x-forwarded-for": ip },
    });
    const sessionRes = await proxy(sessionReq);
    assert.notEqual(sessionRes.status, 429, "/api/auth/session should not be blocked");

    // 3. /api/username and /api/links are NOT blocked at proxy level
    const usernameReq = new NextRequest("http://localhost/api/username/check?username=testuser", {
        headers: { "x-forwarded-for": ip },
    });
    const usernameRes = await proxy(usernameReq);
    assert.notEqual(usernameRes.status, 429, "/api/username/check should not be blocked by proxy");

    const linksReq = new NextRequest("http://localhost/api/links", {
        headers: { "x-forwarded-for": ip },
    });
    const linksRes = await proxy(linksReq);
    assert.notEqual(linksRes.status, 429, "/api/links should not be blocked by proxy");
});
