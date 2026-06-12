import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type JobPayload = Exclude<Prisma.JsonValue, null>;

export async function enqueueJob(type: string, payload: JobPayload, opts?: { scheduleAt?: Date }) {
  const runAfter = opts?.scheduleAt ?? null;
  const job = await prisma.job.create({
    data: {
      type,
      payload,
      status: opts?.scheduleAt ? "SCHEDULED" : "PENDING",
      scheduleAt: opts?.scheduleAt,
      runAfter,
    },
  });
  return job;
}

export async function getJob(id: string) {
  return prisma.job.findUnique({ where: { id } });
}

export async function markJobProcessing(id: string) {
  return prisma.job.update({ where: { id }, data: { status: "PROCESSING", updatedAt: new Date() } });
}

export async function markJobCompleted(id: string) {
  return prisma.job.update({ where: { id }, data: { status: "COMPLETED", updatedAt: new Date() } });
}

export async function markJobFailed(id: string, error?: string) {
  return prisma.job.update({
    where: { id },
    data: { status: "FAILED", lastError: error, attempts: { increment: 1 }, updatedAt: new Date() },
  });
}

// Polling-based worker helper: finds the next eligible job and marks it processing.
export async function claimNextJob() {
  const now = new Date();
  // find a pending or scheduled job whose runAfter is null or in the past
  const job = await prisma.job.findFirst({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "SCHEDULED", runAfter: { lte: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return null;

  // try to atomically mark processing
  try {
    const claimed = await prisma.job.update({
      where: { id: job.id },
      data: { status: "PROCESSING", updatedAt: new Date() },
    });
    return claimed;
  } catch {
    return null;
  }
}

type JobRecord = { id: string; type: string; payload: Prisma.JsonValue };

export async function processJobWithHandler(job: JobRecord, handlers: Record<string, (payload: JobPayload) => Promise<void> | void>) {
  try {
    const handler = handlers[job.type];
    if (!handler) throw new Error(`no handler for job type ${job.type}`);
    // Cast payload to JobPayload, excluding null values that shouldn't exist
    const payload = job.payload as JobPayload;
    await handler(payload);
    await markJobCompleted(job.id);
  } catch (err: unknown) {
    await markJobFailed(job.id, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

const jobs = {
  enqueueJob,
  getJob,
  claimNextJob,
  processJobWithHandler,
};

export default jobs;
