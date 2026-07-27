import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type JobPayload = Exclude<Prisma.JsonValue, null>;

export async function enqueueJob(type: string, payload: JobPayload, opts?: { scheduleAt?: Date; userId?: string }) {
  const runAfter = opts?.scheduleAt ?? null;
  const job = await prisma.job.create({
    data: {
      type,
      payload,
      userId: opts?.userId ?? "",
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

const MAX_ATTEMPTS = 5;

export async function markJobFailed(id: string, error?: string) {
  const job = await prisma.job.findUnique({ where: { id }, select: { attempts: true } });
  if (!job) return null;

  const nextAttempts = job.attempts + 1;

  if (nextAttempts >= MAX_ATTEMPTS) {
    return prisma.job.update({
      where: { id },
      data: { status: "FAILED", lastError: error, attempts: nextAttempts, updatedAt: new Date() },
    });
  } else {
    const delaySeconds = Math.pow(2, nextAttempts) * 60;
    const runAfter = new Date(Date.now() + delaySeconds * 1000);
    return prisma.job.update({
      where: { id },
      data: { status: "PENDING", lastError: error, attempts: nextAttempts, runAfter, updatedAt: new Date() },
    });
  }
}

export async function releaseJob(id: string) {
  return prisma.job.update({
    where: { id },
    data: { status: "PENDING", updatedAt: new Date() },
  });
}

// Polling-based worker helper: finds the next eligible job and marks it processing.
// Optionally filter by job type. If a non-matching job is found first, it is left
// untouched so other workers can process it.
//
// Uses an atomic UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1)
// query to prevent the race condition where multiple concurrent workers could
// claim and process the same job (see issue #397).
export async function claimNextJob(type?: string) {
  const now = new Date();

  // Build the type filter clause conditionally
  const typeFilter = type ? Prisma.sql`AND "type" = ${type}` : Prisma.empty;

  // Atomic claim: the subquery locks the first eligible row with FOR UPDATE
  // SKIP LOCKED, which means concurrent workers will skip already-locked rows
  // and claim the next available job instead of waiting or double-claiming.
  const result = await prisma.$queryRaw<Array<{
    id: string;
    type: string;
    payload: Prisma.JsonValue;
    status: string;
    scheduleAt: Date | null;
    attempts: number;
    lastError: string | null;
    runAfter: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>>`
    UPDATE "Job"
    SET "status" = 'PROCESSING', "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "id"
      FROM "Job"
      WHERE (
        "status" IN ('PENDING', 'SCHEDULED')
        AND ("runAfter" IS NULL OR "runAfter" <= ${now})
      )
      ${typeFilter}
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;

  return result.length > 0 ? result[0] : null;
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
  releaseJob,
  processJobWithHandler,
};

export default jobs;
