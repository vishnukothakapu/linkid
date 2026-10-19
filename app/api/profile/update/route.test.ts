import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockWorkspace: unknown = { id: "workspace-1", role: "OWNER" };
// Result of prisma.workspace.findUnique({ where: { username } }) - a competing
// primary username, when set.
let mockExistingWorkspace: unknown = null;
let mockExistingAlias: unknown = null;
const invalidatedWorkspaceIds: string[] = [];

// ── Register mocks synchronously BEFORE the route is imported ─────────────────

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

// @/lib/workspace imports `server-only`, which throws under tsx.
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

mock.module("@/lib/prisma", {
    namedExports: {
        prisma: {
            workspace: {
                findUnique: (args: { where?: { username?: string } }) =>
                    Promise.resolve(args.where?.username ? mockExistingWorkspace : null),
            },
            workspaceAlias: {
                findUnique: () => Promise.resolve(mockExistingAlias),
            },
            profileDraft: {
                upsert: (args: { update?: Record<string, unknown>; create?: Record<string, unknown> }) => {
                    const blank = {
                        name: null,
                        username: null,
                        bio: null,
                        image: null,
                        themeType: null,
                        themeColor: null,
                        themeCustom: null,
                        backgroundImage: null,
                    };
                    return Promise.resolve({ ...blank, ...args.create, ...args.update });
                },
            },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PATCH: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/profile/update/route");
    PATCH = route.PATCH;
});

function patchRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/profile/update", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

test("PATCH 401 - no session", async () => {
    mockSession = null;
    const res = await PATCH(patchRequest({ name: "New name" }));
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
});

test("PATCH 400 - non-string username does not reach the database", async () => {
    mockSession = { user: { id: "user-1" } };
    mockWorkspace = { id: "workspace-1", role: "OWNER" };

    const res = await PATCH(patchRequest({ username: 123 }));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Username must be a string" });
});

test("PATCH 400 - invalid username returns the validator message", async () => {
    mockSession = { user: { id: "user-1" } };
    mockWorkspace = { id: "workspace-1", role: "OWNER" };
    mockExistingWorkspace = null;
    mockExistingAlias = null;

    const res = await PATCH(patchRequest({ username: "ab" }));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Username must be at least 3 characters" });
});

test("PATCH 409 - username claimed by another workspace", async () => {
    mockSession = { user: { id: "user-1" } };
    mockWorkspace = { id: "workspace-1", role: "OWNER" };
    mockExistingWorkspace = { id: "workspace-2", username: "taken-name" };
    mockExistingAlias = null;

    const res = await PATCH(patchRequest({ username: "taken-name" }));
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "Username already taken" });
});

test("PATCH 200 - valid update saves the draft and purges the workspace cache", async () => {
    mockSession = { user: { id: "user-1" } };
    mockWorkspace = { id: "workspace-1", role: "OWNER" };
    mockExistingWorkspace = null;
    mockExistingAlias = null;
    invalidatedWorkspaceIds.length = 0;

    const res = await PATCH(patchRequest({ username: "new-name", name: "New name" }));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.draft.username, "new-name");
    assert.equal(data.draft.name, "New name");
    assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1"]);
});
