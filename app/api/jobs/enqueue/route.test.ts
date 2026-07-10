import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let mockSession: unknown = null;
let mockRateLimitResult = true;
let mockCreatedJob: unknown = { id: "job-test-id" };

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: () => mockRateLimitResult,
    },
});

mock.module("@/lib/jobs", {
    namedExports: {
        enqueueJob: () => Promise.resolve(mockCreatedJob),
    },
});

let POST: (...args: unknown[]) => Promise<Response>;

before(async () => {
    const route = await import("./route");
    POST = route.POST;
});

function postRequest(body: unknown): Request {
    return new Request("http://localhost/api/jobs/enqueue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

test("POST 401 — no session", async () => {
    mockSession = null;
    const res = await POST(postRequest({ type: "send-email", payload: {} }));
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
});

test("POST 429 — rate limited", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = false;
    const res = await POST(postRequest({ type: "send-email", payload: {} }));
    assert.equal(res.status, 429);
    assert.deepEqual(await res.json(), { error: "Too many requests. Please slow down." });
});

test("POST 400 — missing required type", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    const res = await POST(postRequest({ payload: {} }));
    assert.equal(res.status, 400);
});

test("POST 400 — invalid job type", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    const res = await POST(postRequest({ type: "unknown-job", payload: {} }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
    assert.match(body.error, /unsupported job type/i);
});

test("POST 400 — invalid payload (not an object)", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    const res = await POST(postRequest({ type: "send-email", payload: "string-instead-of-object" }));
    assert.equal(res.status, 400);
});

test("POST 400 — invalid scheduleAt (not ISO string)", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    const res = await POST(postRequest({
        type: "recalculate-analytics",
        payload: {},
        scheduleAt: "not-a-date",
    }));
    assert.equal(res.status, 400);
});

test("POST 200 — valid enqueue with type and payload", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    mockCreatedJob = { id: "job-123" };
    const res = await POST(postRequest({ type: "send-email", payload: { to: "test@example.com" } }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "job-123");
});

test("POST 200 — valid enqueue with scheduleAt", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    mockCreatedJob = { id: "job-456" };
    const res = await POST(postRequest({
        type: "recalculate-analytics",
        payload: { userId: "uid" },
        scheduleAt: "2026-07-10T12:00:00.000Z",
    }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "job-456");
});

test("POST 200 — payload defaults to empty object when omitted", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockRateLimitResult = true;
    mockCreatedJob = { id: "job-789" };
    const res = await POST(postRequest({ type: "send-email" }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "job-789");
});
