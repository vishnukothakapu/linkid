import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

type UpdateManyArgs = {
    where: {
        status?: string;
        updatedAt?: { lt: Date };
        attempts?: { gte?: number; lt?: number };
    };
    data: {
        status?: string;
        attempts?: { increment?: number };
        lastError?: string;
    };
};

const calls: UpdateManyArgs[] = [];
let counts: number[] = [];

mock.module("@/lib/prisma", {
    defaultExport: {
        job: {
            updateMany: async (args: UpdateManyArgs) => {
                calls.push(args);
                return { count: counts[calls.length - 1] ?? 0 };
            },
        },
    },
    namedExports: {
        prisma: {
            job: {
                updateMany: async (args: UpdateManyArgs) => {
                    calls.push(args);
                    return { count: counts[calls.length - 1] ?? 0 };
                },
            },
        },
    },
});

let reclaimStaleJobs: (now?: Date) => Promise<{ failed: number; reclaimed: number }>;

before(async () => {
    const mod = await import("@/lib/jobs");
    reclaimStaleJobs = mod.reclaimStaleJobs;
});

test("marks exhausted stale jobs failed and returns the rest to the queue", async () => {
    calls.length = 0;
    counts = [2, 3];

    const now = new Date("2026-10-20T12:00:00.000Z");
    const result = await reclaimStaleJobs(now);

    assert.deepEqual(result, { failed: 2, reclaimed: 3 });
    assert.equal(calls.length, 2);

    const [exhausted, reclaimable] = calls;
    const staleBefore = new Date(now.getTime() - 5 * 60 * 1000);

    assert.equal(exhausted.where.status, "PROCESSING");
    assert.equal(exhausted.where.attempts?.gte, 5);
    assert.equal(exhausted.where.updatedAt?.lt.toISOString(), staleBefore.toISOString());
    assert.equal(exhausted.data.status, "FAILED");
    assert.equal(exhausted.data.lastError, "Job lease expired before completion");

    assert.equal(reclaimable.where.status, "PROCESSING");
    assert.equal(reclaimable.where.attempts?.lt, 5);
    assert.equal(reclaimable.where.updatedAt?.lt.toISOString(), staleBefore.toISOString());
    assert.equal(reclaimable.data.status, "PENDING");
    assert.equal(reclaimable.data.attempts?.increment, 1);
    assert.equal(reclaimable.data.lastError, "Job lease expired before completion");
});

test("does nothing when there are no stale jobs", async () => {
    calls.length = 0;
    counts = [0, 0];

    const result = await reclaimStaleJobs(new Date("2026-10-20T12:00:00.000Z"));

    assert.deepEqual(result, { failed: 0, reclaimed: 0 });
    assert.equal(calls.length, 2);
});
