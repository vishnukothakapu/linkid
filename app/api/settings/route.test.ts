import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockWorkspace: unknown = { id: "workspace-1", role: "OWNER" };
let updateResult: Record<string, unknown> = {};
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
    defaultExport: {
        workspace: {
            findUnique: () =>
                Promise.resolve({ id: "workspace-1", webhookSecret: "existing-secret" }),
            update: () =>
                Promise.resolve({
                    enableEmailCapture: false,
                    webhookUrl: null,
                    webhookSecret: null,
                    ...updateResult,
                }),
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PUT: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/settings/route");
    PUT = route.PUT;
});

function putRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

test("PUT 401 - no session", async () => {
    mockSession = null;
    const res = await PUT(putRequest({ enableEmailCapture: true }));
    assert.equal(res.status, 401);
});

test("PUT 200 - owner receives the webhook secret", async () => {
    mockSession = { user: { id: "owner-1" } };
    mockWorkspace = { id: "workspace-1", role: "OWNER" };
    updateResult = {
        enableEmailCapture: false,
        webhookUrl: "https://example.com/hook",
        webhookSecret: "secret-key",
    };
    invalidatedWorkspaceIds.length = 0;

    const res = await PUT(putRequest({ enableEmailCapture: false }));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.webhookSecret, "secret-key");
    assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1"]);
});

test("PUT 200 - non-owner member never receives the webhook secret", async () => {
    mockSession = { user: { id: "editor-1" } };
    mockWorkspace = { id: "workspace-1", role: "EDITOR" };
    updateResult = {
        enableEmailCapture: true,
        webhookUrl: "https://example.com/hook",
        webhookSecret: "secret-key",
    };

    const res = await PUT(putRequest({ enableEmailCapture: true }));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal("webhookSecret" in data, false);
    assert.equal(data.enableEmailCapture, true);
});

test("PUT 403 - non-owner member cannot configure webhooks", async () => {
    mockSession = { user: { id: "editor-1" } };
    mockWorkspace = { id: "workspace-1", role: "EDITOR" };

    const res = await PUT(putRequest({ webhookUrl: "https://example.com/hook" }));
    assert.equal(res.status, 403);
    assert.deepEqual(await res.json(), { error: "Only workspace owners can configure webhooks" });
});
