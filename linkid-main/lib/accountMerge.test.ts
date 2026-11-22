import assert from "node:assert/strict";
import { mock, test } from "node:test";

/**
 * Regression test for account merges failing when the target workspace has no
 * username yet and the source workspace owns one.
 *
 * Workspace.username is UNIQUE. If the merge transaction assigns the source
 * username to the target workspace while the source workspace row still holds
 * it, PostgreSQL raises a unique-constraint violation (P2002) and the entire
 * merge rolls back. The source username must therefore be released first.
 *
 * Prisma operations are recorded in the order they are queued (PrismaPromises
 * in a batch transaction run sequentially in that order).
 */

type Op = { model: string; action: string; args: any };
const ops: Op[] = [];
let transactionOps: Op[] = [];

function op(model: string, action: string) {
    return (args: any) => {
        const entry = { model, action, args };
        ops.push(entry);
        return entry;
    };
}

const sourceWorkspace = {
    id: "ws-source",
    name: "Source",
    bio: null,
    username: "alice",
};
const targetWorkspace = {
    id: "ws-target",
    name: "Target",
    bio: null,
    username: null as string | null,
    role: "OWNER",
};

const modelProxy = (model: string, overrides: Record<string, unknown> = {}) =>
    new Proxy(overrides, {
        get: (t, action: string) => (t as any)[action] ?? op(model, action),
    });

const fakePrisma = {
    accountMergeRequest: modelProxy("accountMergeRequest", {
        findUnique: async () => ({
            id: "req-1",
            targetUserId: "user-target",
            consumedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
        }),
    }),
    user: modelProxy("user", {
        findUnique: async ({ where }: any) => ({
            id: where.id,
            email: `${where.id}@example.com`,
            password: null,
            name: null,
            image: null,
            emailVerified: null,
            accounts: [],
            sessions: [],
        }),
    }),
    workspaceMember: modelProxy("workspaceMember", {
        findFirst: async () => ({ role: "OWNER", workspace: sourceWorkspace }),
    }),
    link: modelProxy("link", { findMany: async () => [] }),
    subscriber: modelProxy("subscriber", { findMany: async () => [] }),
    workspace: modelProxy("workspace"),
    workspaceAlias: modelProxy("workspaceAlias"),
    clickEvent: modelProxy("clickEvent"),
    dailyLinkAnalytics: modelProxy("dailyLinkAnalytics"),
    usernameHistory: modelProxy("usernameHistory"),
    profileVersion: modelProxy("profileVersion"),
    profilePreviewToken: modelProxy("profilePreviewToken"),
    profileDraft: modelProxy("profileDraft"),
    account: modelProxy("account"),
    session: modelProxy("session"),
    accountMergeEvent: modelProxy("accountMergeEvent"),
    $transaction: async (batch: Op[]) => {
        transactionOps = batch;
        return batch;
    },
};

mock.module("@/lib/prisma", {
    defaultExport: fakePrisma,
    namedExports: { prisma: fakePrisma },
});
mock.module("@/lib/workspace", {
    namedExports: { resolveActiveWorkspace: async () => targetWorkspace },
});
mock.module("bcryptjs", {
    defaultExport: { compare: async () => true },
});

test("merge releases the source workspace username before assigning it to the target", async () => {
    const { completeAccountMerge } = await import("@/lib/accountMerge");

    await completeAccountMerge({
        sourceUserId: "user-source",
        code: "LNK-AAAAAA-BBBBBB",
        confirmEmail: "user-source@example.com",
    });

    const usernameWrites = transactionOps
        .map((entry, index) => ({ entry, index }))
        .filter(
            ({ entry }) =>
                entry.model === "workspace" &&
                entry.action === "update" &&
                entry.args?.data &&
                "username" in entry.args.data
        );

    const release = usernameWrites.find(
        ({ entry }) =>
            entry.args.where.id === "ws-source" && entry.args.data.username === null
    );
    const assign = usernameWrites.find(
        ({ entry }) =>
            entry.args.where.id === "ws-target" && entry.args.data.username === "alice"
    );
    const deleteSource = transactionOps.findIndex(
        (entry) => entry.model === "workspace" && entry.action === "delete"
    );

    assert.ok(assign, "target workspace should receive the source username");
    assert.ok(
        release,
        "source workspace must release the unique username before the target is assigned it"
    );
    assert.ok(
        release.index < assign.index,
        "username must be released BEFORE it is assigned (unique constraint)"
    );
    assert.ok(deleteSource > assign.index, "source workspace is still deleted at the end");
});

test("merge does not touch usernames when the target already has one", async () => {
    targetWorkspace.username = "bob";
    transactionOps = [];
    const { completeAccountMerge } = await import("@/lib/accountMerge");

    await completeAccountMerge({
        sourceUserId: "user-source",
        code: "LNK-AAAAAA-BBBBBB",
        confirmEmail: "user-source@example.com",
    });

    const usernameWrites = transactionOps.filter(
        (entry) =>
            entry.model === "workspace" &&
            entry.action === "update" &&
            entry.args?.data &&
            "username" in entry.args.data
    );
    assert.equal(usernameWrites.length, 0);
    assert.ok(
        transactionOps.some(
            (entry) => entry.model === "workspaceAlias" && entry.action === "upsert"
        ),
        "old username should still be aliased to the target"
    );
});
