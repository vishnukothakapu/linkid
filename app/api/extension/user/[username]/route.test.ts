import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
let resolved: unknown = { workspaceId: "ws-1" };
let workspace: unknown = null;
let capturedFindArgs: unknown = null;

// ── Register mocks synchronously BEFORE the route is imported ─────────────────

mock.module("@/lib/userLookup", {
    namedExports: {
        resolveWorkspaceByUsernameOrAlias: () => Promise.resolve(resolved),
    },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        workspace: {
            findUnique: (args: unknown) => {
                capturedFindArgs = args;
                return Promise.resolve(workspace);
            },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GET: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/extension/user/[username]/route");
    GET = route.GET;
});

function ctx(username = "jane") {
    return { params: Promise.resolve({ username }) };
}

function workspaceFixture() {
    return {
        id: "ws-1",
        name: "Jane",
        username: "jane",
        members: [{ user: { name: "Jane", image: null } }],
        links: [
            { id: "link-1", platform: "github", url: "https://github.com/jane", label: "GitHub", pinCode: null },
            { id: "link-2", platform: "x", url: "https://x.com/jane", label: "X", pinCode: "1234" },
        ],
    };
}

test("GET 404 when the username cannot be resolved", async () => {
    resolved = null;
    const res = await GET(new Request("http://localhost/api/extension/user/jane"), ctx());
    assert.equal(res.status, 404);
});

test("GET 200 masks the URL of PIN-locked links", async () => {
    resolved = { workspaceId: "ws-1" };
    workspace = workspaceFixture();

    const res = await GET(new Request("http://localhost/api/extension/user/jane"), ctx());
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.links.length, 2);
    assert.deepEqual(data.links[0], {
        id: "link-1",
        platform: "github",
        url: "https://github.com/jane",
        label: "GitHub",
        locked: false,
    });
    assert.equal(data.links[1].url, null);
    assert.equal(data.links[1].locked, true);
});

test("GET filters the links query by public visibility and schedule window", async () => {
    resolved = { workspaceId: "ws-1" };
    workspace = workspaceFixture();
    capturedFindArgs = null;

    await GET(new Request("http://localhost/api/extension/user/jane"), ctx());

    const args = capturedFindArgs as {
        where: { id: string };
        include: { links: { where: Record<string, unknown> } };
    };
    assert.equal(args.where.id, "ws-1");

    const linksWhere = args.include.links.where;
    assert.equal(linksWhere.isPublic, true);

    // Start bound: null or <= now.
    assert.equal(Array.isArray(linksWhere.OR), true);
    const startOr = linksWhere.OR as Array<Record<string, unknown>>;
    assert.equal(startOr.length, 2);
    assert.deepEqual(startOr[0], { startDate: null });
    assert.ok(startOr[1].startDate);

    // End bound: null or >= now.
    const and = linksWhere.AND as Array<{ OR: Array<Record<string, unknown>> }>;
    assert.equal(Array.isArray(and), true);
    assert.equal(and[0].OR.length, 2);
    assert.deepEqual(and[0].OR[0], { endDate: null });
    assert.ok(and[0].OR[1].endDate);
});
