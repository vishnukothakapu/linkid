import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// ── Mutable state shared across mock closures ─────────────────────────────────
const ops: string[] = [];
const lockValues: unknown[] = [];
let draft: unknown = null;
let currentWorkspace: unknown = null;
let availabilityWorkspace: unknown = null;
let workspaceFindCount = 0;

const mockTx = {
    $queryRaw: (_strings: TemplateStringsArray, ...values: unknown[]) => {
        ops.push("lock");
        lockValues.push(...values);
        return Promise.resolve([]);
    },
    profileDraft: {
        findUnique: () => {
            ops.push("draft.findUnique");
            return Promise.resolve(draft);
        },
        delete: () => {
            ops.push("draft.delete");
            return Promise.resolve({});
        },
    },
    workspace: {
        findUnique: () => {
            ops.push("workspace.findUnique");
            workspaceFindCount += 1;
            if (workspaceFindCount === 1) return Promise.resolve(currentWorkspace);
            return Promise.resolve(availabilityWorkspace ?? currentWorkspace);
        },
        update: () => {
            ops.push("workspace.update");
            return Promise.resolve({});
        },
    },
    workspaceMember: {
        findFirst: () => {
            ops.push("member.findFirst");
            return Promise.resolve({ userId: "user-1", user: { image: null } });
        },
    },
    workspaceAlias: {
        findUnique: () => {
            ops.push("alias.findUnique");
            return Promise.resolve(null);
        },
        create: () => {
            ops.push("alias.create");
            return Promise.resolve({});
        },
        upsert: () => {
            ops.push("alias.upsert");
            return Promise.resolve({});
        },
    },
    user: {
        update: () => {
            ops.push("user.update");
            return Promise.resolve({});
        },
    },
    profileVersion: {
        create: () => {
            ops.push("version.create");
            return Promise.resolve({});
        },
    },
    profilePreviewToken: {
        updateMany: () => {
            ops.push("preview.updateMany");
            return Promise.resolve({});
        },
    },
    usernameHistory: {
        findUnique: () => Promise.resolve(null),
        create: () => Promise.resolve({}),
    },
};

mock.module("@/lib/prisma", {
    namedExports: {
        prisma: {
            $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx),
        },
    },
});

type PublishProfileDraft = (workspaceId: string) => Promise<unknown>;
let publishProfileDraft: PublishProfileDraft;

before(async () => {
    const workflow = await import("@/lib/profileWorkflow");
    publishProfileDraft = workflow.publishProfileDraft as PublishProfileDraft;
});

function resetState() {
    ops.length = 0;
    lockValues.length = 0;
    draft = { workspaceId: "ws-1", username: "new-name" };
    currentWorkspace = {
        id: "ws-1",
        name: "Old",
        username: "old-name",
        bio: null,
        backgroundImage: null,
        themeType: null,
        themeColor: null,
        themeCustom: null,
    };
    availabilityWorkspace = null;
    workspaceFindCount = 0;
}

test("publishProfileDraft locks the new username before rechecking availability", async () => {
    resetState();

    await publishProfileDraft("ws-1");

    const lockIndex = ops.indexOf("lock");
    assert.ok(lockIndex !== -1, "the username lock must be taken");

    // The initial workspace fetch happens before the lock, the availability
    // recheck happens after it.
    assert.equal(ops.filter((op) => op === "workspace.findUnique").length, 2);
    assert.ok(lockIndex < ops.lastIndexOf("workspace.findUnique"));
    assert.ok(lockIndex < ops.indexOf("workspace.update"));
    assert.ok(lockIndex < ops.indexOf("alias.findUnique"));
    assert.deepEqual(lockValues, ["new-name"]);
});

test("publishProfileDraft does not lock when the username is unchanged", async () => {
    resetState();
    draft = { workspaceId: "ws-1", username: "old-name" };

    await publishProfileDraft("ws-1");

    assert.equal(ops.includes("lock"), false);
    assert.equal(ops.includes("workspace.update"), true);
});

test("publishProfileDraft rejects when the locked name is owned by another workspace", async () => {
    resetState();
    // The recheck under the lock sees a workspace that is not this one.
    availabilityWorkspace = { id: "ws-other", username: "new-name" };

    await assert.rejects(publishProfileDraft("ws-1"), /Username already taken/);

    assert.equal(ops.indexOf("lock") < ops.lastIndexOf("workspace.findUnique"), true);
    assert.equal(ops.includes("workspace.update"), false);
});
