import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashToken,
  generateToken,
  createPendingSubscription,
  confirmSubscription,
  unsubscribeSubscription,
  RESEND_COOLDOWN_MS,
  CONFIRMATION_TOKEN_EXPIRY_MS,
} from "./subscriberConsent";

function createMockPrisma() {
  const subscribers: any[] = [];
  const tokens: any[] = [];
  const jobs: any[] = [];

  const client: any = {
    subscriber: {
      findUnique: async ({ where }: any) => {
        if (where.email_workspaceId) {
          const sub = subscribers.find(
            (s) =>
              s.email.toLowerCase() === where.email_workspaceId.email.toLowerCase() &&
              s.workspaceId === where.email_workspaceId.workspaceId
          );
          if (!sub) return null;
          const subTokens = tokens
            .filter((t) => t.subscriberId === sub.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return { ...sub, tokens: subTokens };
        }
        if (where.id) {
          return subscribers.find((s) => s.id === where.id) || null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const id = `sub_${subscribers.length + 1}`;
        const newSub = {
          id,
          email: data.email,
          workspaceId: data.workspaceId,
          status: data.status || "PENDING",
          confirmedAt: null,
          unsubscribedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        subscribers.push(newSub);
        if (data.tokens?.create) {
          for (const t of data.tokens.create) {
            tokens.push({
              id: `tok_${tokens.length + 1}`,
              subscriberId: id,
              tokenHash: t.tokenHash,
              type: t.type,
              expiresAt: t.expiresAt,
              usedAt: null,
              createdAt: new Date(),
            });
          }
        }
        return newSub;
      },
      update: async ({ where, data }: any) => {
        const sub = subscribers.find((s) => s.id === where.id);
        if (!sub) throw new Error("Subscriber not found");
        Object.assign(sub, data, { updatedAt: new Date() });
        return sub;
      },
    },
    subscriberToken: {
      findUnique: async ({ where }: any) => {
        const tok = tokens.find((t) => t.tokenHash === where.tokenHash);
        if (!tok) return null;
        const sub = subscribers.find((s) => s.id === tok.subscriberId);
        return { ...tok, subscriber: sub };
      },
      create: async ({ data }: any) => {
        const newTok = {
          id: `tok_${tokens.length + 1}`,
          subscriberId: data.subscriberId,
          tokenHash: data.tokenHash,
          type: data.type,
          expiresAt: data.expiresAt,
          usedAt: null,
          createdAt: new Date(),
        };
        tokens.push(newTok);
        return newTok;
      },
      createMany: async ({ data }: any) => {
        for (const item of data) {
          tokens.push({
            id: `tok_${tokens.length + 1}`,
            subscriberId: item.subscriberId,
            tokenHash: item.tokenHash,
            type: item.type,
            expiresAt: item.expiresAt,
            usedAt: null,
            createdAt: new Date(),
          });
        }
        return { count: data.length };
      },
      update: async ({ where, data }: any) => {
        const tok = tokens.find((t) => t.id === where.id);
        if (!tok) throw new Error("Token not found");
        Object.assign(tok, data);
        return tok;
      },
    },
    job: {
      create: async ({ data }: any) => {
        const newJob = {
          id: `job_${jobs.length + 1}`,
          ...data,
          status: "PENDING",
          createdAt: new Date(),
        };
        jobs.push(newJob);
        return newJob;
      },
    },
    _state: { subscribers, tokens, jobs },
  };

  return client;
}

test("initial submission creates pending consent and does not confirm subscriber", async () => {
  const client = createMockPrisma();

  const result = await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  assert.equal(result.status, "PENDING");
  assert.equal(client._state.subscribers.length, 1);
  assert.equal(client._state.subscribers[0].status, "PENDING");
  assert.equal(client._state.subscribers[0].confirmedAt, null);

  // Generates confirmation and unsubscribe tokens
  assert.equal(client._state.tokens.length, 2);
  assert.ok(client._state.tokens.some((t: any) => t.type === "CONFIRMATION"));
  assert.ok(client._state.tokens.some((t: any) => t.type === "UNSUBSCRIBE"));

  // Outbox job enqueued for confirmation email
  assert.equal(client._state.jobs.length, 1);
  assert.equal(client._state.jobs[0].type, "subscriber-confirmation");
  assert.equal(client._state.jobs[0].payload.to, "reader@example.com");
});

test("confirmation is idempotent and updates status to CONFIRMED", async () => {
  const client = createMockPrisma();

  await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  const confirmJob = client._state.jobs[0];
  const url = new URL(confirmJob.payload.confirmationUrl);
  const rawToken = url.searchParams.get("token")!;
  assert.ok(rawToken);

  // Confirm subscription
  const result1 = await confirmSubscription(client, rawToken);
  assert.equal(result1.success, true);
  assert.equal(client._state.subscribers[0].status, "CONFIRMED");
  assert.ok(client._state.subscribers[0].confirmedAt instanceof Date);

  // Second confirmation with same token is idempotent
  const result2 = await confirmSubscription(client, rawToken);
  assert.equal(result2.success, true);
  assert.equal(result2.alreadyConfirmed, true);
  assert.equal(client._state.subscribers[0].status, "CONFIRMED");
});

test("replayed token cannot reactivate consent after unsubscribe", async () => {
  const client = createMockPrisma();

  await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  const confirmUrl = new URL(client._state.jobs[0].payload.confirmationUrl);
  const rawConfirmToken = confirmUrl.searchParams.get("token")!;
  const unsubUrl = new URL(client._state.jobs[0].payload.unsubscribeUrl);
  const rawUnsubToken = unsubUrl.searchParams.get("token")!;

  // 1. Confirm subscription
  const confirmResult = await confirmSubscription(client, rawConfirmToken);
  assert.equal(confirmResult.success, true);
  assert.equal(client._state.subscribers[0].status, "CONFIRMED");

  // 2. Unsubscribe
  const unsubResult = await unsubscribeSubscription(client, rawUnsubToken);
  assert.equal(unsubResult.success, true);
  assert.equal(client._state.subscribers[0].status, "UNSUBSCRIBED");

  // 3. Attempt replay of confirmation token
  const replayResult = await confirmSubscription(client, rawConfirmToken);
  assert.equal(replayResult.success, false);
  assert.equal(replayResult.error, "TOKEN_ALREADY_USED");
  assert.equal(client._state.subscribers[0].status, "UNSUBSCRIBED");
});

test("expired token cannot confirm subscription", async () => {
  const client = createMockPrisma();

  await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  const confirmUrl = new URL(client._state.jobs[0].payload.confirmationUrl);
  const rawConfirmToken = confirmUrl.searchParams.get("token")!;

  // Artificially expire the token
  client._state.tokens[0].expiresAt = new Date(Date.now() - 1000);

  const result = await confirmSubscription(client, rawConfirmToken);
  assert.equal(result.success, false);
  assert.equal(result.error, "EXPIRED_OR_INVALID");
  assert.equal(client._state.subscribers[0].status, "PENDING");
});

test("bounded resend respects cooldown period", async () => {
  const client = createMockPrisma();

  // First request
  const res1 = await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });
  assert.equal(res1.status, "PENDING");
  assert.equal(client._state.jobs.length, 1);

  // Immediate second request: within cooldown
  const res2 = await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });
  assert.equal(res2.status, "RESEND_COOLDOWN");
  assert.equal(client._state.jobs.length, 1); // No new job enqueued

  // Simulate cooldown passage
  client._state.tokens[0].createdAt = new Date(Date.now() - RESEND_COOLDOWN_MS - 5000);

  // Third request after cooldown: allowed resend
  const res3 = await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });
  assert.equal(res3.status, "PENDING_RESENT");
  assert.equal(client._state.jobs.length, 2); // New job enqueued
});

test("subscribing when already confirmed returns ALREADY_CONFIRMED without altering state", async () => {
  const client = createMockPrisma();

  await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  const confirmUrl = new URL(client._state.jobs[0].payload.confirmationUrl);
  await confirmSubscription(client, confirmUrl.searchParams.get("token")!);

  const res = await createPendingSubscription(client, {
    email: "reader@example.com",
    workspaceId: "ws_123",
    workspaceUsername: "alice",
  });

  assert.equal(res.status, "ALREADY_CONFIRMED");
  assert.equal(client._state.subscribers[0].status, "CONFIRMED");
  assert.equal(client._state.jobs.length, 1); // No second job created
});
