import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockWorkspace: unknown = { id: "workspace-1" };
let capturedUpdateArgs: unknown = null;
let updateResult: unknown = { layoutStyle: "GRID" };
const invalidatedWorkspaceIds: string[] = [];

// ── Register mocks synchronously BEFORE the route is imported ──────────────────
// (importing the route directly pulls in @/lib/auth, which uses `server-only`.)
mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

// @/lib/workspace imports `server-only`, which throws under tsx - mock it out.
mock.module("@/lib/workspace", {
    namedExports: {
        resolveActiveWorkspace: () => Promise.resolve(mockWorkspace),
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

const workspaceUpdate = (args: unknown) => {
    capturedUpdateArgs = args;
    return Promise.resolve(updateResult);
};

mock.module("@/lib/prisma", {
    defaultExport: { workspace: { update: workspaceUpdate } },
    namedExports: { prisma: { workspace: { update: workspaceUpdate } } },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PATCH: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/user/layout/route");
    PATCH = route.PATCH;
});

function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/user/layout", {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

test("returns 401 when unauthorized", async () => {
    mockSession = null;
    const res = await PATCH(makeReq({ layoutStyle: "GRID" }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "Unauthorized");
});

test("returns 400 for an invalid layoutStyle", async () => {
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    const res = await PATCH(makeReq({ layoutStyle: "INVALID" }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Invalid layout style");
});

test("returns 200 and updates the layoutStyle", async () => {
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    mockWorkspace = { id: "workspace-1" };
    capturedUpdateArgs = null;
    updateResult = { layoutStyle: "GRID" };
    invalidatedWorkspaceIds.length = 0;

    const res = await PATCH(makeReq({ layoutStyle: "GRID" }));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.layoutStyle, "GRID");
    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "workspace-1" },
        data: { layoutStyle: "GRID" },
    });
    // The public profile cache is keyed by workspace id, so the purge must use
    // the resolved workspace - not the session user.
    assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1"]);
});
