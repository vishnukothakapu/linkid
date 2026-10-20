import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let attempts = 0;
let lastKey = "";
let lastLimit = 0;

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: async (key: string, limit: number) => {
            attempts++;
            lastKey = key;
            lastLimit = limit;
            return attempts <= limit;
        },
    },
});

mock.module("@/lib/workspace", {
    namedExports: {
        resolveActiveWorkspace: async () => null,
    },
});

const mergeRequest = {
    id: "req-1",
    targetUserId: "target-user",
    consumedAt: null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
};

const fakePrisma = {
    accountMergeRequest: {
        findUnique: async () => mergeRequest,
    },
    user: {
        findUnique: async () => ({
            password: null,
            email: "victim@example.com",
        }),
    },
};

mock.module("@/lib/prisma", {
    defaultExport: fakePrisma,
    namedExports: { prisma: fakePrisma },
});

let completeAccountMerge: typeof import("@/lib/accountMerge").completeAccountMerge;
let MergeError: typeof import("@/lib/accountMerge").MergeError;

before(async () => {
    const mod = await import("@/lib/accountMerge");
    completeAccountMerge = mod.completeAccountMerge;
    MergeError = mod.MergeError;
});

test("limits repeated merge confirmation attempts", async () => {
    attempts = 0;
    lastKey = "";
    lastLimit = 0;

    const sourceUserId = "user-rate-limit-test";
    const attempt = () =>
        completeAccountMerge({
            sourceUserId,
            code: "not-a-real-code",
            confirmEmail: "wrong@example.com",
        });

    for (let i = 0; i < 10; i++) {
        await assert.rejects(
            attempt(),
            (error: unknown) => error instanceof MergeError && error.status === 401
        );
    }

    await assert.rejects(
        attempt(),
        (error: unknown) =>
            error instanceof MergeError &&
            error.status === 429 &&
            /too many confirmation attempts/i.test(error.message)
    );

    assert.equal(lastKey, `merge-confirm:${sourceUserId}`);
    assert.equal(lastLimit, 10);
    assert.equal(attempts, 11);
});
