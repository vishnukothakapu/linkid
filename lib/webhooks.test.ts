import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { createHmac } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
mock.module("./ssrf", { namedExports: { validateWebhookUrl: async () => {} } });
import { dispatchWebhook } from "./webhooks";
const envelope = {
  id: "evt_event",
  event: "test.ping",
  timestamp: "2026-11-22T00:00:00Z",
  data: { message: "hello" },
};
function fixture() {
  const saved: {
    status?: string;
    responseBody?: string;
    eventId?: string;
    attempt?: number;
    error?: string;
  }[] = [];
  const base = {
    id: "event",
    eventId: "event",
    workspaceId: "workspace",
    attempt: 0,
    event: "test.ping",
    url: "https://receiver.example/hook",
    requestBody: envelope,
    workspace: {
      webhookUrl: "https://receiver.example/hook",
      webhookSecret: "test-signing-secret",
    },
  };
  const client = {
    webhookDelivery: {
      findUnique: async ({ where }: { where: { id?: string } }) =>
        where.id ? base : null,
      upsert: async ({ create }: { create: (typeof saved)[number] }) => {
        saved.push(create);
        return create;
      },
    },
  } as unknown as PrismaClient;
  return { base, client, saved };
}
test("signs exact bytes, forbids redirects and sends stable delivery headers", async () => {
  const { client, saved } = fixture();
  await dispatchWebhook(client, "event", 1, {
    validate: async () => {},
    fetch: async (_url, init) => {
      assert.equal(init?.redirect, "error");
      assert.ok(init?.signal);
      const headers = init?.headers as Record<string, string>;
      assert.equal(
        headers["x-linkid-signature"],
        createHmac("sha256", "test-signing-secret")
          .update(String(init?.body))
          .digest("hex"),
      );
      assert.equal(headers["x-linkid-delivery-id"], "event");
      assert.equal(headers["x-linkid-event"], "test.ping");
      assert.deepEqual(JSON.parse(String(init?.body)), envelope);
      return new Response("ok", { status: 200 });
    },
  });
  assert.equal(saved[0].status, "SUCCESS");
  assert.equal(saved[0].responseBody, "ok");
});
test("failed HTTP attempts are logged and thrown for the existing job retry policy", async () => {
  const { client, saved } = fixture();
  for (const attempt of [1, 2])
    await assert.rejects(
      dispatchWebhook(client, "event", attempt, {
        validate: async () => {},
        fetch: async () => new Response("unavailable", { status: 503 }),
      }),
    );
  assert.deepEqual(
    saved.map((s) => [s.eventId, s.attempt, s.status]),
    [
      ["event", 1, "FAILED"],
      ["event", 2, "FAILED"],
    ],
  );
});
test("response capture consumes at most 1024 bytes", async () => {
  const { client, saved } = fixture();
  await dispatchWebhook(client, "event", 1, {
    validate: async () => {},
    fetch: async () => new Response("x".repeat(100_000)),
  });
  assert.equal(saved[0].responseBody?.length, 1024);
});
test("DNS validation and stalled response bodies share the deadline", async () => {
  const first = fixture();
  let calls = 0;
  await assert.rejects(
    dispatchWebhook(first.client, "event", 1, {
      timeoutMs: 25,
      validate: () => new Promise(() => {}),
      fetch: async () => {
        calls++;
        return new Response("");
      },
    }),
    /deadline/,
  );
  assert.equal(calls, 0);
  assert.equal(first.saved[0].status, "FAILED");
  const second = fixture();
  await assert.rejects(
    dispatchWebhook(second.client, "event", 1, {
      timeoutMs: 25,
      validate: async () => {},
      fetch: async () =>
        new Response(new ReadableStream({ pull: () => new Promise(() => {}) })),
    }),
    /deadline/,
  );
  assert.equal(second.saved[0].status, "FAILED");
});
test("disabled/changed webhook configuration cannot send queued data", async () => {
  const { client, base, saved } = fixture();
  base.workspace.webhookUrl = "https://changed.example/hook";
  let sent = false;
  await assert.rejects(
    dispatchWebhook(client, "event", 1, {
      fetch: async () => {
        sent = true;
        return new Response("");
      },
    }),
  );
  assert.equal(sent, false);
  assert.match(saved[0].error ?? "", /configuration changed/);
});
