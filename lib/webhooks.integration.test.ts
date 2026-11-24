import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
import { dispatchWebhook } from "./webhooks";
test(
  "actual clicks/subscribers atomically enqueue events; retries preserve event identity",
  { skip: !process.env.WEBHOOK_TEST_URL },
  async () => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.WEBHOOK_TEST_URL }),
    });
    mock.module("@/lib/prisma", {
      defaultExport: client,
      namedExports: { prisma: client },
    });
    mock.module("@/lib/rateLimit", {
      namedExports: { checkRateLimit: async () => true },
    });
    const { processAnalyticsJob } = await import("./analytics");
    const { POST } = await import("@/app/api/subscribe/route");
    try {
      const workspace = await client.workspace.create({
        data: {
          username: "webhook-test",
          enableEmailCapture: true,
          webhookUrl: "https://receiver.example/hook",
          webhookSecret: "test-secret",
        },
      });
      const link = await client.link.create({
        data: {
          workspaceId: workspace.id,
          platform: "website",
          label: "Test",
          url: "https://example.test",
        },
      });
      const payload = {
        linkId: link.id,
        workspaceId: workspace.id,
        userAgent: "Mozilla/5.0",
        referrer: null,
        country: "FR",
        acceptLanguage: "en",
        ip: "203.0.113.1",
      };
      await processAnalyticsJob(payload, "click-job");
      await processAnalyticsJob(payload, "click-job");
      assert.equal(
        await client.clickEvent.count({ where: { id: "click-job" } }),
        1,
      );
      assert.equal(
        (await client.link.findUniqueOrThrow({ where: { id: link.id } }))
          .clicks,
        1,
      );
      assert.equal(
        await client.job.count({ where: { id: "webhook-click-job" } }),
        1,
      );
      const makeRequest = () =>
        new NextRequest("http://localhost/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "webhook-test",
            email: "subscriber@example.test",
          }),
        });
      assert.equal((await POST(makeRequest())).status, 200);
      assert.equal((await POST(makeRequest())).status, 200);
      assert.equal(
        await client.webhookDelivery.count({
          where: {
            workspaceId: workspace.id,
            event: "subscriber.created",
            attempt: 0,
          },
        }),
        1,
      );
      await assert.rejects(
        dispatchWebhook(client, "click-job", 1, {
          validate: async () => {},
          fetch: async () => new Response("fail", { status: 503 }),
        }),
      );
      await dispatchWebhook(client, "click-job", 2, {
        validate: async () => {},
        fetch: async () => new Response("ok"),
      });
      const attempts = await client.webhookDelivery.findMany({
        where: { eventId: "click-job", attempt: { gt: 0 } },
        orderBy: { attempt: "asc" },
      });
      assert.deepEqual(
        attempts.map((a) => [a.attempt, a.status]),
        [
          [1, "FAILED"],
          [2, "SUCCESS"],
        ],
      );
      assert.deepEqual(attempts[0].requestBody, attempts[1].requestBody);
      await client.$executeRawUnsafe(
        `CREATE FUNCTION fail_test_webhook_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id = 'webhook-rollback-click' THEN RAISE EXCEPTION 'forced enqueue failure'; END IF; RETURN NEW; END $$`,
      );
      await client.$executeRawUnsafe(
        'CREATE TRIGGER fail_test_webhook_job BEFORE INSERT ON "Job" FOR EACH ROW EXECUTE FUNCTION fail_test_webhook_job()',
      );
      await assert.rejects(processAnalyticsJob(payload, "rollback-click"));
      assert.equal(
        await client.clickEvent.findUnique({ where: { id: "rollback-click" } }),
        null,
      );
      assert.equal(
        await client.webhookDelivery.count({
          where: { eventId: "rollback-click" },
        }),
        0,
      );
      assert.equal(
        (await client.link.findUniqueOrThrow({ where: { id: link.id } }))
          .clicks,
        1,
      );
    } finally {
      await client.$disconnect();
    }
  },
);
