import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

type DeleteManyArgs = {
    where: {
        status?: { in?: string[] };
        updatedAt?: { lt: Date };
    };
};

const deleteCalls: DeleteManyArgs[] = [];
let deletedCount = 0;

mock.module("@/lib/prisma", {
    defaultExport: {
        job: {
            deleteMany: async (args: DeleteManyArgs) => {
                deleteCalls.push(args);
                return { count: deletedCount };
            },
        },
    },
    namedExports: {
        prisma: {
            job: {
                deleteMany: async (args: DeleteManyArgs) => {
                    deleteCalls.push(args);
                    return { count: deletedCount };
                },
            },
        },
    },
});

let pruneOldJobs: (now?: Date) => Promise<{ count: number }>;

before(async () => {
    const mod = await import("@/lib/jobRetention");
    pruneOldJobs = mod.pruneOldJobs;
});

test("deletes terminal jobs older than the retention window", async () => {
    deleteCalls.length = 0;
    deletedCount = 12;

    const now = new Date("2026-10-20T12:00:00.000Z");
    const result = await pruneOldJobs(now);

    assert.deepEqual(result, { count: 12 });
    assert.equal(deleteCalls.length, 1);

    const args = deleteCalls[0];
    assert.ok(args);
    assert.deepEqual(args.where.status?.in, ["COMPLETED", "FAILED"]);
    assert.equal(
        args.where.updatedAt?.lt.toISOString(),
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );
});

test("reports zero when there is nothing to prune", async () => {
    deleteCalls.length = 0;
    deletedCount = 0;

    const result = await pruneOldJobs(new Date("2026-10-20T12:00:00.000Z"));

    assert.deepEqual(result, { count: 0 });
    assert.equal(deleteCalls.length, 1);
});
