import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

type MockMember = { id: string; role: "OWNER" | "EDITOR"; createdAt: Date };
type MockMembership = {
    id: string;
    role: "OWNER" | "EDITOR";
    workspace: {
        id: string;
        username: string | null;
        members: MockMember[];
    };
};

let memberships: MockMembership[] = [];
const events: string[] = [];
const cacheInvalidations: string[] = [];
const usernameInvalidations: string[] = [];
let deleteManyArgs: { where: { id: { in: string[] } } } | null = null;
const promotionArgs: Array<{ where: { id: string }; data: { role: string } }> = [];

mock.module("next-auth", {
    namedExports: {
        getServerSession: async () => ({ user: { id: "user-1" } }),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

const fakePrisma = {
    user: {
        findUnique: async () => ({
            id: "user-1",
            password: null,
            email: "alice@example.com",
        }),
        delete: async () => {
            events.push("deleteUser");
            return {};
        },
    },
    workspaceMember: {
        findMany: async () => memberships,
        update: async (args: { where: { id: string }; data: { role: string } }) => {
            promotionArgs.push(args);
            events.push(`promote:${args.where.id}`);
            return {};
        },
    },
    workspace: {
        deleteMany: async (args: { where: { id: { in: string[] } } }) => {
            deleteManyArgs = args;
            events.push("deleteWorkspaces");
            return { count: args.where.id.in.length };
        },
    },
    // Prisma executes the array in order. The individual mock calls already
    // recorded their intent when the array was built.
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
};

mock.module("@/lib/prisma", {
    defaultExport: fakePrisma,
    namedExports: { prisma: fakePrisma },
});

mock.module("@/lib/deleteOtpStore", {
    namedExports: {
        verifyOtp: async () => ({ valid: true }),
        clearOtp: async () => {
            events.push("clearOtp");
            return {};
        },
    },
});

mock.module("@/lib/sessionInvalidation", {
    namedExports: {
        invalidateUserSessions: async () => {
            events.push("invalidateUserSessions");
            return {};
        },
    },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: async () => true,
    },
});

mock.module("@/lib/profileCache", {
    namedExports: {
        invalidateProfileCache: async (workspaceId: string) => {
            cacheInvalidations.push(workspaceId);
        },
        invalidateProfileUsername: async (username: string) => {
            usernameInvalidations.push(username);
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DELETE: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/user/delete/route");
    DELETE = route.DELETE;
});

function deleteRequest() {
    return new Request("http://localhost/api/user/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otp: "123456" }),
    });
}

test("deletes solo workspaces and promotes a member in shared workspaces", async () => {
    events.length = 0;
    cacheInvalidations.length = 0;
    usernameInvalidations.length = 0;
    promotionArgs.length = 0;
    deleteManyArgs = null;

    memberships = [
        {
            id: "member-solo",
            role: "OWNER",
            workspace: {
                id: "ws-solo",
                username: "alice",
                members: [],
            },
        },
        {
            id: "member-shared",
            role: "OWNER",
            workspace: {
                id: "ws-shared",
                username: "team",
                members: [
                    { id: "member-editor", role: "EDITOR", createdAt: new Date("2026-01-01") },
                    { id: "member-editor-2", role: "EDITOR", createdAt: new Date("2026-02-01") },
                ],
            },
        },
        {
            id: "member-team2",
            role: "OWNER",
            workspace: {
                id: "ws-team2",
                username: "team2",
                members: [
                    { id: "member-owner-2", role: "OWNER", createdAt: new Date("2026-01-01") },
                ],
            },
        },
    ];

    const res = await DELETE(deleteRequest());

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { success: true });

    assert.deepEqual(deleteManyArgs, {
        where: { id: { in: ["ws-solo"] } },
    });

    assert.equal(promotionArgs.length, 1);
    assert.deepEqual(promotionArgs[0], {
        where: { id: "member-editor" },
        data: { role: "OWNER" },
    });

    assert.equal(events.includes("invalidateUserSessions"), true);
    assert.equal(events.includes("clearOtp"), true);
    assert.equal(events.includes("deleteUser"), true);

    assert.deepEqual(cacheInvalidations.sort(), ["ws-shared", "ws-solo", "ws-team2"]);
    assert.deepEqual(usernameInvalidations, ["alice"]);
});

test("deletes the user with no workspaces", async () => {
    events.length = 0;
    cacheInvalidations.length = 0;
    usernameInvalidations.length = 0;
    promotionArgs.length = 0;
    deleteManyArgs = null;
    memberships = [];

    const res = await DELETE(deleteRequest());

    assert.equal(res.status, 200);
    assert.deepEqual(deleteManyArgs, { where: { id: { in: [] } } });
    assert.equal(promotionArgs.length, 0);
    assert.equal(events.includes("deleteUser"), true);
    assert.deepEqual(cacheInvalidations, []);
    assert.deepEqual(usernameInvalidations, []);
});
