import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { generateCsrfToken } from "@/lib/csrf";
import { applyCsrfProtection, getCsrfDecision } from "@/lib/middleware/csrf";

test("getCsrfDecision skips safe methods and excluded routes", () => {
    assert.equal(
        getCsrfDecision({
            method: "GET",
            pathname: "/api/links",
            requestToken: null,
            storedToken: null,
        }),
        "skip"
    );

    assert.equal(
        getCsrfDecision({
            method: "POST",
            pathname: "/api/auth/signin",
            requestToken: null,
            storedToken: null,
        }),
        "skip"
    );
});

test("applyCsrfProtection rejects requests with a missing token", async () => {
    const request = new NextRequest("http://localhost/api/links", {
        method: "POST",
        headers: {
            cookie: `csrf_token=${generateCsrfToken()}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ url: "https://example.com" }),
    });

    const response = await applyCsrfProtection(request);

    assert.ok(response);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Invalid CSRF token" });
});

test("applyCsrfProtection rejects requests with an invalid token", async () => {
    const storedToken = generateCsrfToken();
    const request = new NextRequest("http://localhost/api/profile/update", {
        method: "POST",
        headers: {
            cookie: `csrf_token=${storedToken}`,
            "content-type": "application/json",
            "x-csrf-token": generateCsrfToken(),
        },
        body: JSON.stringify({ name: "Navya" }),
    });

    const response = await applyCsrfProtection(request);

    assert.ok(response);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Invalid CSRF token" });
});

test("applyCsrfProtection allows requests with a valid token", async () => {
    const token = generateCsrfToken();
    const request = new NextRequest("http://localhost/api/links", {
        method: "POST",
        headers: {
            cookie: `csrf_token=${token}`,
            "content-type": "application/json",
            "x-csrf-token": token,
        },
        body: JSON.stringify({ url: "https://example.com" }),
    });

    const response = await applyCsrfProtection(request);

    assert.equal(response, null);
});
