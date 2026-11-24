import { randomUUID, createHmac } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { validateWebhookUrl } from "./ssrf";

export type WebhookEvent = "link.clicked" | "subscriber.created" | "test.ping";
/** Call inside the source event's transaction: event and job commit together. */
export async function enqueueWorkspaceWebhook(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  event: WebhookEvent,
  data: Prisma.InputJsonObject,
  eventId: string = randomUUID(),
  queue = true,
) {
  const workspace = await tx.workspace.findUnique({
    where: { id: workspaceId },
    select: { webhookUrl: true, webhookSecret: true },
  });
  if (!workspace?.webhookUrl || !workspace.webhookSecret) return null;
  const envelope = {
    id: `evt_${eventId}`,
    event,
    timestamp: new Date().toISOString(),
    data,
  };
  const delivery = await tx.webhookDelivery.upsert({
    where: { eventId_attempt: { eventId, attempt: 0 } },
    update: {},
    create: {
      id: eventId,
      eventId,
      workspaceId,
      event,
      url: workspace.webhookUrl,
      requestBody: envelope,
      status: "QUEUED",
      attempt: 0,
    },
  });
  if (queue)
    await tx.job.upsert({
      where: { id: `webhook-${eventId}` },
      update: {},
      create: {
        id: `webhook-${eventId}`,
        type: "webhook-dispatch",
        payload: { deliveryId: delivery.id },
        userId: "",
        status: "PENDING",
      },
    });
  return delivery;
}

async function boundedBody(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const bytes = new Uint8Array(1024);
  let size = 0;
  try {
    while (size < bytes.length) {
      const { value, done } = await reader.read();
      if (done) break;
      const part = value.subarray(0, bytes.length - size);
      bytes.set(part, size);
      size += part.length;
    }
    return new TextDecoder().decode(bytes.subarray(0, size));
  } finally {
    void reader.cancel().catch(() => {});
  }
}
type DispatchDependencies = {
  fetch?: typeof fetch;
  validate?: typeof validateWebhookUrl;
  timeoutMs?: number;
};
export async function dispatchWebhook(
  client: PrismaClient,
  deliveryId: string,
  attempt: number,
  dependencies: DispatchDependencies = {},
) {
  if (!Number.isSafeInteger(attempt) || attempt < 1)
    throw new Error("Invalid delivery attempt");
  const base = await client.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      workspace: { select: { webhookUrl: true, webhookSecret: true } },
    },
  });
  if (!base) return null; // Workspace deletion cascaded away the outbox payload.
  if (base.attempt !== 0) throw new Error("Expected the queued event identity");
  const prior = await client.webhookDelivery.findUnique({
    where: { eventId_attempt: { eventId: base.eventId, attempt } },
  });
  if (prior?.status === "SUCCESS") return prior;
  const started = Date.now(),
    controller = new AbortController();
  let statusCode: number | null = null,
    responseBody = "",
    failure = "";
  const timeout = setTimeout(
    () => controller.abort(),
    dependencies.timeoutMs ?? 10_000,
  );
  const deadline = new Promise<never>((_resolve, reject) =>
    controller.signal.addEventListener(
      "abort",
      () => reject(new Error("Delivery deadline exceeded")),
      { once: true },
    ),
  );
  try {
    await Promise.race([
      deadline,
      (async () => {
        if (
          !base.workspace.webhookSecret ||
          base.url !== base.workspace.webhookUrl
        )
          throw new Error("Webhook configuration changed or was disabled");
        await (dependencies.validate ?? validateWebhookUrl)(base.url);
        controller.signal.throwIfAborted();
        const body = JSON.stringify(base.requestBody);
        const signature = createHmac("sha256", base.workspace.webhookSecret)
          .update(body)
          .digest("hex");
        const response = await (dependencies.fetch ?? fetch)(base.url, {
          method: "POST",
          redirect: "error",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "x-linkid-signature": signature,
            "x-linkid-event": base.event,
            "x-linkid-delivery-id": base.eventId,
          },
          body,
        });
        statusCode = response.status;
        responseBody = await boundedBody(response);
        if (!response.ok)
          throw new Error(`Remote endpoint returned HTTP ${response.status}`);
      })(),
    ]);
  } catch (error) {
    failure = controller.signal.aborted
      ? "Delivery deadline exceeded"
      : error instanceof Error &&
          /^(Remote endpoint returned HTTP|Webhook configuration changed)/.test(
            error.message,
          )
        ? error.message.slice(0, 250)
        : "Endpoint validation or network request failed";
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
  const record = await client.webhookDelivery.upsert({
    where: { eventId_attempt: { eventId: base.eventId, attempt } },
    create: {
      eventId: base.eventId,
      workspaceId: base.workspaceId,
      event: base.event,
      url: base.url,
      requestBody: base.requestBody as Prisma.InputJsonValue,
      status: failure ? "FAILED" : "SUCCESS",
      statusCode,
      responseBody,
      durationMs: Date.now() - started,
      error: failure || null,
      attempt,
    },
    update: {
      status: failure ? "FAILED" : "SUCCESS",
      statusCode,
      responseBody,
      durationMs: Date.now() - started,
      error: failure || null,
    },
  });
  if (failure) throw new Error(`Webhook delivery failed: ${failure}`);
  return record;
}
