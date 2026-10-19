import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let memberships: Array<{ workspaceId: string }> = [];
const invalidatedWorkspaceIds: string[] = [];
const userUpdates: Array<{ where: { id: string }; data: { image: string | null } }> = [];

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
    },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        user: {
            update: (args: { where: { id: string }; data: { image: string | null } }) => {
                userUpdates.push(args);
                return Promise.resolve({});
            },
        },
        workspaceMember: {
            findMany: () => Promise.resolve(memberships),
        },
    },
});

mock.module("cloudinary", {
    namedExports: {
        v2: {
            config: () => {},
            uploader: {
                upload_stream: (
                    _options: unknown,
                    callback: (error: unknown, result: { secure_url: string } | null) => void
                ) => ({
                    end: () =>
                        callback(null, {
                            secure_url: "https://res.cloudinary.com/demo/avatar.png",
                        }),
                }),
            },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (...args: any[]) => Promise<Response>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DELETE: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/profile/avatar/route");
    POST = route.POST;
    DELETE = route.DELETE;
});

// A byte-correct PNG signature; hasSupportedImageMagicBytes only inspects the
// first bytes of the buffer.
const PNG_BYTES = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);

function uploadRequest(type: string, bytes: Uint8Array = PNG_BYTES) {
    const form = new FormData();
    form.append("avatar", new File([bytes], "avatar.png", { type }));
    return new Request("http://localhost/api/profile/avatar", {
        method: "POST",
        body: form,
    });
}

test("POST 401 - no session", async () => {
    mockSession = null;
    const res = await POST(uploadRequest("image/png"));
    assert.equal(res.status, 401);
});

test("POST 400 - unsupported declared type", async () => {
    mockSession = { user: { id: "user-1", email: "user@example.com" } };
    const res = await POST(uploadRequest("text/plain"));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Only JPG, PNG and WebP allowed" });
});

test("POST 400 - content does not match an image format", async () => {
    mockSession = { user: { id: "user-1", email: "user@example.com" } };
    const garbage = new Uint8Array(12); // zeros fail every magic-byte check
    const res = await POST(uploadRequest("image/png", garbage));
    assert.equal(res.status, 400);
});

test("POST 200 - purges every workspace the user belongs to", async () => {
    mockSession = { user: { id: "user-1", email: "user@example.com" } };
    memberships = [{ workspaceId: "workspace-1" }, { workspaceId: "workspace-2" }];
    invalidatedWorkspaceIds.length = 0;
    userUpdates.length = 0;

    const res = await POST(uploadRequest("image/png"));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.imageUrl, "https://res.cloudinary.com/demo/avatar.png");

    // The cache is keyed by workspace id - the session user id must not appear.
    assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1", "workspace-2"]);
    assert.deepEqual(userUpdates, [
        {
            where: { id: "user-1" },
            data: { image: "https://res.cloudinary.com/demo/avatar.png" },
        },
    ]);
});

test("DELETE 200 - clears the image and purges every workspace", async () => {
    mockSession = { user: { id: "user-1" } };
    memberships = [{ workspaceId: "workspace-1" }, { workspaceId: "workspace-2" }];
    invalidatedWorkspaceIds.length = 0;
    userUpdates.length = 0;

    const res = await DELETE();
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { success: true });
    assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1", "workspace-2"]);
    assert.deepEqual(userUpdates, [{ where: { id: "user-1" }, data: { image: null } }]);
});
