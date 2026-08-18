import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let capturedUpdateArgs: unknown = null;
let updateResult: unknown = { layoutStyle: "GRID" };

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

const userUpdate = (args: unknown) => {
    capturedUpdateArgs = args;
    return Promise.resolve(updateResult);
};

mock.module("@/lib/prisma", {
    defaultExport: { user: { update: userUpdate } },
    namedExports: { prisma: { user: { update: userUpdate } } },
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
    mockSession = { user: { email: "test@example.com" } };
    const res = await PATCH(makeReq({ layoutStyle: "INVALID" }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Invalid layout style");
});

test("returns 200 and updates the layoutStyle", async () => {
    mockSession = { user: { email: "test@example.com" } };
    capturedUpdateArgs = null;
    updateResult = { layoutStyle: "GRID" };

    const res = await PATCH(makeReq({ layoutStyle: "GRID" }));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.layoutStyle, "GRID");
    assert.deepEqual(capturedUpdateArgs, {
        where: { email: "test@example.com" },
        data: { layoutStyle: "GRID" },
    });
});
