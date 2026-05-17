import "../lib/prisma";
import { claimNextJob, processJobWithHandler } from "../lib/jobs";

// Example handlers: extend this map with your application's heavy tasks
const handlers: Record<string, (payload: any) => Promise<void>> = {
  "send-email": async (payload) => {
    // placeholder: integrate with real email provider
    console.log("[worker] send-email", payload);
  },
  "recalculate-analytics": async (payload) => {
    console.log("[worker] recalc analytics", payload);
  },
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
      await processJobWithHandler(job, handlers as any);
    } catch (err) {
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
