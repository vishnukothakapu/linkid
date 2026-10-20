import { prisma } from "./prisma";

export const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Delete finished jobs after their payload is no longer useful. Click jobs
 * carry the visitor IP, user agent, referrer, and language; keeping them
 * forever turns an operational queue into a permanent activity log.
 */
export async function pruneOldJobs(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - JOB_RETENTION_MS);
  return prisma.job.deleteMany({
    where: {
      status: { in: ["COMPLETED", "FAILED"] },
      updatedAt: { lt: cutoff },
    },
  });
}
