import "../lib/prisma";
import { claimNextJob, processJobWithHandler, type JobPayload } from "../lib/jobs";
import { processAnalyticsJob, type AnalyticsJobPayload } from "../lib/analytics";

import { validateWebhookUrl } from "../lib/ssrf";

const handlers: Record<string, (payload: JobPayload) => Promise<void>> = {
  "analytics-click": async (payload) => {
    const data = payload as unknown as AnalyticsJobPayload;
    await processAnalyticsJob(data);
  },
  "send-email": async (payload) => {
    console.log("[worker] send-email", payload);
  },
  "recalculate-analytics": async (payload) => {
    console.log("[worker] recalc analytics", payload);
  },
  "webhook-dispatch": async (payload) => {
    const { url, signature, payload: bodyPayload } = payload as { url: string; signature: string; payload: any };
    
    // Perform SSRF validation on the destination URL before fetching
    await validateWebhookUrl(url);

    // Prevent redirects to avoid SSRF bypasses via redirection
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-linkid-signature": signature
      },
      body: JSON.stringify(bodyPayload),
      redirect: "error"
    });

    if (!res.ok) {
      throw new Error(`Webhook dispatch failed with status: ${res.status}`);
    }
  }
};

async function loop() {
  while (true) {
    try {
      const job = await claimNextJob();
      if (!job) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      console.log("[worker] claimed job", job.id, job.type);
      await processJobWithHandler(job, handlers);
    } catch (err: unknown) {
      console.error("[worker] job processing error", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

if (require.main === module) {
  console.log("Starting job worker...");
  loop().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
