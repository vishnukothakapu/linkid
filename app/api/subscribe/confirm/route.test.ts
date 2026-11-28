import assert from "node:assert/strict";
import { mock, test, before, beforeEach } from "node:test";
import { NextRequest } from "next/server";

let confirmResult: any = { success: true, subscriberId: "sub_1" };
const calls: string[] = [];

mock.module("@/lib/prisma", {
  defaultExport: {},
});

mock.module("@/lib/subscriberConsent", {
  namedExports: {
    confirmSubscription: async (_client: any, token: string) => {
      calls.push(token);
      return confirmResult;
    },
  },
});

let GET: typeof import("./route").GET;
let POST: typeof import("./route").POST;

before(async () => {
  const mod = await import("./route");
  GET = mod.GET;
  POST = mod.POST;
});

beforeEach(() => {
  confirmResult = { success: true, subscriberId: "sub_1" };
  calls.length = 0;
});

test("GET returns 400 when confirmation token is missing", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/confirm");
  const res = await GET(req);
  assert.equal(res.status, 400);
  assert.equal(calls.length, 0);
});

test("GET returns 400 when confirmation token is invalid or expired", async () => {
  confirmResult = { success: false, error: "EXPIRED_OR_INVALID" };
  const req = new NextRequest("http://localhost/api/subscribe/confirm?token=badtoken");
  const res = await GET(req);
  assert.equal(res.status, 400);
  assert.equal(calls[0], "badtoken");
});

test("GET returns 400 when token was already used and cannot reactivate consent", async () => {
  confirmResult = { success: false, error: "TOKEN_ALREADY_USED" };
  const req = new NextRequest("http://localhost/api/subscribe/confirm?token=replayedtoken");
  const res = await GET(req);
  assert.equal(res.status, 400);
  const text = await res.text();
  assert.ok(text.includes("cannot reactivate consent"));
});

test("GET confirms subscription successfully and returns HTML", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/confirm?token=validtoken");
  const res = await GET(req);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes("Subscription Confirmed"));
  assert.equal(calls[0], "validtoken");
});

test("POST returns JSON with success status", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "validtoken" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});
