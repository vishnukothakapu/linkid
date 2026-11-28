import assert from "node:assert/strict";
import { mock, test, before, beforeEach } from "node:test";
import { NextRequest } from "next/server";

let unsubscribeResult: any = { success: true };
const calls: string[] = [];

mock.module("@/lib/prisma", {
  defaultExport: {},
});

mock.module("@/lib/subscriberConsent", {
  namedExports: {
    unsubscribeSubscription: async (_client: any, token: string) => {
      calls.push(token);
      return unsubscribeResult;
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
  unsubscribeResult = { success: true };
  calls.length = 0;
});

test("GET returns 400 when unsubscribe token is missing", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/unsubscribe");
  const res = await GET(req);
  assert.equal(res.status, 400);
});

test("GET returns 400 when unsubscribe token is invalid", async () => {
  unsubscribeResult = { success: false, error: "EXPIRED_OR_INVALID" };
  const req = new NextRequest("http://localhost/api/subscribe/unsubscribe?token=badtoken");
  const res = await GET(req);
  assert.equal(res.status, 400);
  assert.equal(calls[0], "badtoken");
});

test("GET unsubscribes successfully and returns HTML", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/unsubscribe?token=unsub123");
  const res = await GET(req);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes("Unsubscribed Successfully"));
  assert.equal(calls[0], "unsub123");
});

test("POST unsubscribes successfully and returns JSON", async () => {
  const req = new NextRequest("http://localhost/api/subscribe/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "unsub123" }),
  });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});
