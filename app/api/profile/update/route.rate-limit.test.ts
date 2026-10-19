import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let workspace: unknown = { id: "ws-1", username: "jane" };
let rateAllowed = true;
let resolveCalls = 0;
const rateLimitCalls: Array<{ key: string; limit: number; windowMs: number }> = [];
const draftCalls: Array<{ workspaceId: string; data: Record<string, unknown> }> = [];
const invalidatedWorkspaceIds: string[] = [];
let draftError: Error | null = null;

// ── Register mocks synchronously BEFORE the route is imported ─────────────────

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: (key: string, limit: number, windowMs: number) => {
            rateLimitCalls.push({ key, limit, windowMs });
            return Promise.resolve(rateAllowed);
        },
    },
});

mock.module("@/lib/workspace", {
    namedExports: {
        resolveActiveWorkspace: () => {
            resolveCalls += 1;
            return Promise.resolve(workspace);
        },
    },
});

mock.module("@/lib/profileWorkflow", {
    namedExports: {
        upsertProfileDraft: (
            workspaceId: string,
            data: Record<string, unknown>
        ) => {
            if (draftError) return Promise.reject(draftError);
            draftCalls.push({ workspaceId, data });
            return Promise.resolve({ username: "jane" });
        },
    },
});

mock.module("@/lib/profileCache", {
    namedExports: {
        invalidateProfileCache: (workspaceId: string) => {
            invalidatedWorkspaceIds.push(workspaceId);
            return Promise.resolve();
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PATCH: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/profile/update/route");
    PATCH = route.PATCH;
});

function updateRequest(
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
) {
    return new Request("http://localhost/api/profile/update", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
}

function resetState() {
    mockSession = { user: { id: "user-1", email: "user@example.com" } };
    workspace = { id: "ws-1", username: "jane" };
    rateAllowed = true;
    resolveCalls = 0;
    rateLimitCalls.length = 0;
    draftCalls.length = 0;
    invalidatedWorkspaceIds.length = 0;
    draftError = null;
}

test("PATCH 401 without a session and without consuming the limiter", async () => {
    resetState();
    mockSession = null;

    const res = await PATCH(updateRequest({ name: "Jane" }));
    assert.equal(res.status, 401);
    assert.equal(rateLimitCalls.length, 0);
});

test("PATCH 429 once the per-user budget is exhausted", async () => {
    resetState();
    rateAllowed = false;

    const res = await PATCH(updateRequest({ name: "Jane" }));
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "60");
    assert.deepEqual(await res.json(), { error: "Too many requests" });

    // The limiter runs before any database work.
    assert.equal(resolveCalls, 0);
    assert.equal(draftCalls.length, 0);
});

test("PATCH limits 20 writes per minute per user", async () => {
    resetState();

    await PATCH(updateRequest({ name: "Jane" }));

    assert.deepEqual(rateLimitCalls, [
        { key: "profile-update:user-1", limit: 20, windowMs: 60 * 1000 },
    ]);
});

test("PATCH 200 saves the draft and purges the workspace cache", async () => {
    resetState();

    const res = await PATCH(
        updateRequest({ username: "Jane", name: "Jane Doe", bio: "hi" })
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { success: true, draft: { username: "jane" } });

    assert.equal(draftCalls.length, 1);
    assert.equal(draftCalls[0].workspaceId, "ws-1");
    // The username is lowercased before the draft is written.
    assert.equal(draftCalls[0].data.username, "jane");
    assert.deepEqual(invalidatedWorkspaceIds, ["ws-1"]);
});

test("PATCH 404 when the user has no workspace", async () => {
    resetState();
    workspace = null;

    const res = await PATCH(updateRequest({ name: "Jane" }));
    assert.equal(res.status, 404);
});

test("PATCH 403 when the requested workspace is not the active one", async () => {
    resetState();

    const res = await PATCH(
        updateRequest({ name: "Jane" }, { "x-workspace-id": "ws-other" })
    );
    assert.equal(res.status, 403);
    assert.equal(draftCalls.length, 0);
});

test("PATCH 409 when the draft username is taken", async () => {
    resetState();
    draftError = new Error("Username already taken");

    const res = await PATCH(updateRequest({ username: "taken" }));
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Username already taken" });
});
