import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mergeResult: Record<string, unknown> = {};
const invalidatedWorkspaceIds: string[] = [];
const invalidatedUsernames: string[] = [];

// ── Register mocks synchronously BEFORE the route is imported ─────────────────

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("next/cache", {
    namedExports: { revalidateTag: () => {} },
});

mock.module("@/lib/profileCache", {
    namedExports: {
        invalidateProfileCache: (workspaceId: string) => {
            invalidatedWorkspaceIds.push(workspaceId);
            return Promise.resolve();
        },
        invalidateProfileUsername: (username: string) => {
            invalidatedUsernames.push(username);
            return Promise.resolve();
        },
    },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        user: {
            findUnique: () => Promise.resolve({ id: "user-source" }),
        },
    },
});

mock.module("@/lib/accountMerge", {
    namedExports: {
        MergeError: class MergeError extends Error {
            status: number;
            constructor(message: string, status: number) {
                super(message);
                this.name = "MergeError";
                this.status = status;
            }
        },
        completeAccountMerge: () => Promise.resolve(mergeResult),
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/profile/merge/complete/route");
    POST = route.POST;
});

function mergeRequest(body: unknown): Request {
    return new Request("http://localhost/api/profile/merge/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

test("POST 401 - no session", async () => {
    mockSession = null;
    const res = await POST(mergeRequest({ code: "LNK-AAAAAA-BBBBBB" }));
    assert.equal(res.status, 401);
});

test("POST 400 - missing merge code", async () => {
    mockSession = { user: { email: "source@example.com" } };
    const res = await POST(mergeRequest({}));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Merge code is required" });
});

test("POST 200 - purges both workspace caches and both username indexes", async () => {
    mockSession = { user: { email: "source@example.com" } };
    mergeResult = {
        mergedLinks: 2,
        mergedAccounts: 1,
        transferredSessions: 1,
        conflicts: [],
        sourceWorkspaceId: "ws-source",
        targetWorkspaceId: "ws-target",
        sourceUsername: "alice",
        targetUsername: "bob",
    };
    invalidatedWorkspaceIds.length = 0;
    invalidatedUsernames.length = 0;

    const res = await POST(mergeRequest({ code: "LNK-AAAAAA-BBBBBB" }));
    assert.equal(res.status, 200);

    // The cache is keyed by workspace id; the user ids must never be used.
    assert.deepEqual(invalidatedWorkspaceIds, ["ws-source", "ws-target"]);
    assert.deepEqual(invalidatedUsernames, ["alice", "bob"]);
});

test("POST 200 - does not clear the same username index twice", async () => {
    mockSession = { user: { email: "source@example.com" } };
    mergeResult = {
        mergedLinks: 0,
        mergedAccounts: 1,
        transferredSessions: 0,
        conflicts: [],
        sourceWorkspaceId: "ws-source",
        targetWorkspaceId: "ws-target",
        // The target inherited the source username, so both names are equal.
        sourceUsername: "alice",
        targetUsername: "alice",
    };
    invalidatedWorkspaceIds.length = 0;
    invalidatedUsernames.length = 0;

    const res = await POST(mergeRequest({ code: "LNK-AAAAAA-BBBBBB" }));
    assert.equal(res.status, 200);
    assert.deepEqual(invalidatedUsernames, ["alice"]);
});
