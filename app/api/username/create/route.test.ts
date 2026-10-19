import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let workspace: unknown = { id: "ws-1", username: "old-name" };
let topLevelWorkspace: unknown = null;
let topLevelAlias: unknown = null;
let txWorkspace: unknown = null;
let txAlias: unknown = null;
let updateError: Error | null = null;
const ops: string[] = [];
const lockValues: unknown[] = [];
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

mock.module("@/lib/workspace", {
    namedExports: {
        resolveActiveWorkspace: () => Promise.resolve(workspace),
    },
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

const mockTx = {
    $queryRaw: (_strings: TemplateStringsArray, ...values: unknown[]) => {
        ops.push("lock");
        lockValues.push(...values);
        return Promise.resolve([]);
    },
    workspace: {
        findUnique: () => {
            ops.push("tx.workspace.findUnique");
            return Promise.resolve(txWorkspace);
        },
        update: () => {
            ops.push("tx.workspace.update");
            if (updateError) return Promise.reject(updateError);
            return Promise.resolve({ id: "ws-1", username: "jane" });
        },
    },
    workspaceAlias: {
        findUnique: () => {
            ops.push("tx.workspaceAlias.findUnique");
            return Promise.resolve(txAlias);
        },
        upsert: () => {
            ops.push("tx.workspaceAlias.upsert");
            return Promise.resolve({});
        },
    },
};

mock.module("@/lib/prisma", {
    defaultExport: {
        workspace: {
            findUnique: () => Promise.resolve(topLevelWorkspace),
        },
        workspaceAlias: {
            findUnique: () => Promise.resolve(topLevelAlias),
        },
        $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx),
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/username/create/route");
    POST = route.POST;
});

function createRequest(username: unknown): Request {
    return new Request("http://localhost/api/username/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
    });
}

function resetState() {
    mockSession = { user: { id: "user-1", email: "user@example.com" } };
    workspace = { id: "ws-1", username: "old-name" };
    topLevelWorkspace = null;
    topLevelAlias = null;
    txWorkspace = null;
    txAlias = null;
    updateError = null;
    ops.length = 0;
    lockValues.length = 0;
    invalidatedWorkspaceIds.length = 0;
    invalidatedUsernames.length = 0;
}

test("POST 401 without a session", async () => {
    resetState();
    mockSession = null;
    const res = await POST(createRequest("jane"));
    assert.equal(res.status, 401);
    assert.equal(ops.length, 0);
});

test("POST 400 for an invalid username without opening a transaction", async () => {
    resetState();
    const res = await POST(createRequest("ab"));
    assert.equal(res.status, 400);
    assert.equal(ops.length, 0);
});

test("POST 200 when the workspace already owns the username", async () => {
    resetState();
    workspace = { id: "ws-1", username: "jane" };

    const res = await POST(createRequest("Jane"));
    assert.equal(res.status, 200);
    assert.equal(ops.length, 0);
});

test("POST 409 from the pre-transaction check without a transaction", async () => {
    resetState();
    topLevelWorkspace = { id: "ws-other", username: "jane" };

    const res = await POST(createRequest("jane"));
    assert.equal(res.status, 409);
    assert.equal(ops.length, 0);
});

test("POST 409 when a concurrent claim wins the race inside the transaction", async () => {
    resetState();
    // Pre-check saw nothing, but the recheck under the lock finds a claim
    // committed in between.
    txWorkspace = { id: "ws-other", username: "jane" };

    const res = await POST(createRequest("jane"));
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Username already taken" });

    // The lock is taken before the recheck, and nothing is written.
    assert.equal(ops[0], "lock");
    assert.ok(ops.includes("tx.workspace.findUnique"));
    assert.equal(ops.includes("tx.workspaceAlias.upsert"), false);
    assert.equal(ops.includes("tx.workspace.update"), false);
});

test("POST 409 when the name is an alias owned by someone else", async () => {
    resetState();
    txAlias = { username: "jane", workspaceId: "ws-other" };

    const res = await POST(createRequest("jane"));
    assert.equal(res.status, 409);
    assert.equal(ops[0], "lock");
    assert.equal(ops.includes("tx.workspace.update"), false);
});

test("POST 200 claims the username under the lock and purges both caches", async () => {
    resetState();

    const res = await POST(createRequest("Jane"));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.deepEqual(data.workspace, { id: "ws-1", username: "jane" });

    // Lock first, recheck, alias the old name, then update.
    assert.equal(ops[0], "lock");
    assert.deepEqual(lockValues, ["jane"]);
    assert.ok(ops.indexOf("tx.workspaceAlias.upsert") < ops.indexOf("tx.workspace.update"));
    assert.deepEqual(invalidatedWorkspaceIds, ["ws-1"]);
    assert.deepEqual(invalidatedUsernames, ["jane"]);
});

test("POST 409 when the unique constraint fires despite the lock", async () => {
    resetState();
    updateError = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
        meta: { target: ["username"] },
    });

    const res = await POST(createRequest("jane"));
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Username already taken" });
});
