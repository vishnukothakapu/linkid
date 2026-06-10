import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockLink: unknown = null;
let capturedUpdateArgs: unknown = null;

// ── Register mocks synchronously BEFORE any module import ─────────────────────

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        link: {
            findUnique: () => Promise.resolve(mockLink),
            update: (args: unknown) => {
                capturedUpdateArgs = args;
                return Promise.resolve({});
            },
        },
    },
    namedExports: {
        prisma: {
            link: {
                findUnique: () => Promise.resolve(mockLink),
                update: (args: unknown) => {
                    capturedUpdateArgs = args;
                    return Promise.resolve({});
                },
            },
        },
    },
});

// Dynamic import in before() so it's after mock registration but before tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PUT: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/links/[id]/route");
    PUT = route.PUT;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function putRequest(body: unknown): Request {
    return new Request("http://localhost/api/links/test-id", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

function ctx(id = "test-id") {
    return { params: Promise.resolve({ id }) };
}

function ownerLink(platform = "github") {
    return { id: "test-id", platform, user: { email: "owner@example.com" } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("PUT 401 — no session", async () => {
    mockSession = null;
    const res = await PUT(putRequest({ url: "https://github.com/user" }), ctx());
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
});

test("PUT 403 — link belongs to a different user", async () => {
    mockSession = { user: { email: "attacker@example.com" } };
    mockLink = ownerLink();
    const res = await PUT(putRequest({ url: "https://github.com/user" }), ctx());
    assert.equal(res.status, 403);
});

test("PUT 403 — link not found", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = null;
    const res = await PUT(putRequest({ url: "https://github.com/user" }), ctx());
    assert.equal(res.status, 403);
});

test("PUT 400 — URL fails basic validation (malformed)", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink();
    // "not-valid" → https://not-valid → single part hostname, no TLD
    const res = await PUT(putRequest({ url: "not-valid" }), ctx());
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error, "expected an error message");
});

test("PUT 400 — URL does not match stored platform (different-platform URL)", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink("github");
    // Valid LinkedIn URL for a GitHub link → platform mismatch
    const res = await PUT(putRequest({ url: "https://linkedin.com/in/john-doe" }), ctx());
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Please enter a valid public link" });
});

test("PUT 400 — nothing to update (empty body)", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink();
    const res = await PUT(putRequest({}), ctx());
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Nothing to update" });
});

test("PUT 200 — valid URL matching stored platform updates the link", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink("github");
    capturedUpdateArgs = null;
    const res = await PUT(putRequest({ url: "https://github.com/newuser" }), ctx());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.link, "expected link object in response");
    assert.ok(capturedUpdateArgs, "prisma.link.update should have been called");
});

test("PUT 200 — isPublic boolean update without URL", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink();
    capturedUpdateArgs = null;
    const res = await PUT(putRequest({ isPublic: false }), ctx());
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.link, "expected link object in response");
    assert.ok(capturedUpdateArgs, "prisma.link.update should have been called");
});

test("PUT 400 — non-boolean isPublic with no URL is treated as nothing to update", async () => {
    mockSession = { user: { email: "owner@example.com" } };
    mockLink = ownerLink();
    const res = await PUT(putRequest({ isPublic: "yes" }), ctx());
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Nothing to update" });
});
