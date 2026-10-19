import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockLink: unknown = null;
let requestHeaders = new Headers();
let blockedKeys = new Set<string>();
const rateLimitCalls: Array<{ key: string; limit: number; windowMs: number }> = [];
const trackedClicks: Array<{ linkId: string; workspaceId: string }> = [];

// ── Register mocks synchronously BEFORE the action module is imported ─────────

mock.module("next/headers", {
    namedExports: {
        headers: () => Promise.resolve(requestHeaders),
    },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        link: {
            findUnique: () => Promise.resolve(mockLink),
        },
    },
});

mock.module("@/lib/analytics", {
    namedExports: {
        trackLinkClick: (input: { linkId: string; workspaceId: string }) => {
            trackedClicks.push({ linkId: input.linkId, workspaceId: input.workspaceId });
            return Promise.resolve();
        },
    },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: (key: string, limit: number, windowMs: number) => {
            rateLimitCalls.push({ key, limit, windowMs });
            return Promise.resolve(!blockedKeys.has(key));
        },
    },
});

type VerifyPinAction = (linkId: string, pinCode: string) => Promise<{
    success?: boolean;
    webUrl?: string;
    error?: string;
}>;

let verifyPinAction: VerifyPinAction;

before(async () => {
    const actions = await import("@/app/[username]/[platform]/actions");
    verifyPinAction = actions.verifyPinAction as VerifyPinAction;
});

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function linkFixture(overrides: Record<string, unknown> = {}) {
    return {
        id: "link-1",
        workspaceId: "ws-1",
        platform: "github",
        url: "https://github.com/jane",
        pinCode: "1234",
        isPublic: true,
        startDate: null,
        endDate: null,
        ...overrides,
    };
}

function resetState(overrides: Record<string, unknown> = {}) {
    mockLink = linkFixture(overrides);
    requestHeaders = new Headers({
        "x-forwarded-for": "1.2.3.4",
        "user-agent": DESKTOP_UA,
    });
    blockedKeys = new Set();
    rateLimitCalls.length = 0;
    trackedClicks.length = 0;
}

test("wrong PIN returns a generic error and does not track a click", async () => {
    resetState();
    const res = await verifyPinAction("link-1", "9999");
    assert.deepEqual(res, { error: "Incorrect PIN" });
    assert.equal(trackedClicks.length, 0);
});

test("non-string arguments are rejected without touching the database", async () => {
    resetState();
    const res = await verifyPinAction(123 as unknown as string, "1234");
    assert.deepEqual(res, { error: "Incorrect PIN" });
    assert.equal(rateLimitCalls.length, 0);
});

test("correct PIN on a non-public link is rejected", async () => {
    resetState({ isPublic: false });
    const res = await verifyPinAction("link-1", "1234");
    assert.deepEqual(res, { error: "Incorrect PIN" });
    assert.equal(trackedClicks.length, 0);
});

test("correct PIN before the start date is rejected", async () => {
    resetState({ startDate: new Date(Date.now() + 60 * 60 * 1000) });
    const res = await verifyPinAction("link-1", "1234");
    assert.deepEqual(res, { error: "Incorrect PIN" });
    assert.equal(trackedClicks.length, 0);
});

test("correct PIN after the end date is rejected", async () => {
    resetState({ endDate: new Date(Date.now() - 60 * 60 * 1000) });
    const res = await verifyPinAction("link-1", "1234");
    assert.deepEqual(res, { error: "Incorrect PIN" });
    assert.equal(trackedClicks.length, 0);
});

test("link without a PIN is rejected even when the provided value is empty", async () => {
    resetState({ pinCode: null });
    const res = await verifyPinAction("link-1", "");
    assert.deepEqual(res, { error: "Incorrect PIN" });
});

test("rate limited clients get a throttling error before the link is loaded", async () => {
    resetState();
    blockedKeys = new Set(["pin-verify:1.2.3.4:link-1"]);
    const res = await verifyPinAction("link-1", "1234");
    assert.deepEqual(res, { error: "Too many attempts. Please try again later." });
    assert.equal(trackedClicks.length, 0);
});

test("rate limiting applies per client and per link", async () => {
    resetState();
    await verifyPinAction("link-1", "1234");

    assert.equal(rateLimitCalls.length, 2);
    assert.deepEqual(rateLimitCalls[0], {
        key: "pin-verify:1.2.3.4:link-1",
        limit: 5,
        windowMs: 15 * 60 * 1000,
    });
    assert.deepEqual(rateLimitCalls[1], {
        key: "pin-verify-link:link-1",
        limit: 50,
        windowMs: 15 * 60 * 1000,
    });
});

test("correct PIN on a public, in-window link succeeds and tracks the click", async () => {
    resetState({
        startDate: new Date(Date.now() - 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await verifyPinAction("link-1", "1234");
    assert.equal(res.success, true);
    assert.equal(res.webUrl, "https://github.com/jane");
    assert.deepEqual(trackedClicks, [{ linkId: "link-1", workspaceId: "ws-1" }]);
});

test("unknown links fail with the same error as a wrong PIN", async () => {
    resetState();
    mockLink = null;
    const res = await verifyPinAction("link-1", "1234");
    assert.deepEqual(res, { error: "Incorrect PIN" });
});
