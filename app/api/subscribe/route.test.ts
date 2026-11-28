import assert from "node:assert/strict";
import { mock, test, before, beforeEach } from "node:test";
import { NextRequest } from "next/server";

let rateLimitAllowed = true;
let workspaceRecord: any = null;
let subscriptionResult: any = { status: "PENDING", subscriberId: "sub_1" };
const consentCalls: any[] = [];

mock.module("@/lib/rateLimit", {
  namedExports: {
    checkRateLimit: async () => rateLimitAllowed,
  },
});

mock.module("@/lib/analyticsUtils", {
  namedExports: {
    getForwardedIp: () => "127.0.0.1",
  },
});

mock.module("@/lib/prisma", {
  defaultExport: {
    workspace: {
      findUnique: async () => workspaceRecord,
    },
  },
});

mock.module("@/lib/subscriberConsent", {
  namedExports: {
    createPendingSubscription: async (_client: any, params: any) => {
      consentCalls.push(params);
      return subscriptionResult;
    },
  },
});

let POST: typeof import("./route").POST;

before(async () => {
  POST = (await import("./route")).POST;
});

beforeEach(() => {
  rateLimitAllowed = true;
  workspaceRecord = { id: "ws_1", enableEmailCapture: true };
  subscriptionResult = { status: "PENDING", subscriberId: "sub_1" };
  consentCalls.length = 0;
});

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("rejects invalid email syntax or missing username", async () => {
  const res1 = await POST(createRequest({ email: "invalid", username: "alice" }));
  assert.equal(res1.status, 400);

  const res2 = await POST(createRequest({ email: "alice@example.com" }));
  assert.equal(res2.status, 400);
});

test("rejects when rate limit is exceeded", async () => {
  rateLimitAllowed = false;
  const res = await POST(createRequest({ email: "alice@example.com", username: "alice" }));
  assert.equal(res.status, 429);
});

test("rejects when workspace does not exist or email capture is disabled", async () => {
  workspaceRecord = null;
  const res1 = await POST(createRequest({ email: "alice@example.com", username: "alice" }));
  assert.equal(res1.status, 404);

  workspaceRecord = { id: "ws_1", enableEmailCapture: false };
  const res2 = await POST(createRequest({ email: "alice@example.com", username: "alice" }));
  assert.equal(res2.status, 403);
});

test("creates pending subscription on valid submission", async () => {
  const res = await POST(createRequest({ email: "Alice@Example.com ", username: "alice" }));
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.status, "pending");
  assert.equal(consentCalls.length, 1);
  assert.equal(consentCalls[0].email, "Alice@Example.com");
  assert.equal(consentCalls[0].workspaceId, "ws_1");
});

test("handles resend cooldown with retry-after header", async () => {
  subscriptionResult = { status: "RESEND_COOLDOWN", retryAfterSeconds: 42 };
  const res = await POST(createRequest({ email: "alice@example.com", username: "alice" }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Retry-After"), "42");

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.status, "pending");
});

test("handles already confirmed subscriber idempotently", async () => {
  subscriptionResult = { status: "ALREADY_CONFIRMED", subscriberId: "sub_1" };
  const res = await POST(createRequest({ email: "alice@example.com", username: "alice" }));
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.status, "already_confirmed");
});
