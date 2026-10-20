import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

// Mutable state shared with the transaction double. rollbackProfileVersion now
// works on workspaces: the version carries a workspaceId and the username
// conflicts are checked against Workspace.username / WorkspaceAlias.username.
let mockVersion: unknown = null;
let mockWorkspace: unknown = null;
let mockClaimingWorkspace: unknown = null;
let mockAlias: unknown = null;
let mockOwnerMember: unknown = null;

type FindUniqueArgs = { where?: { id?: string; username?: string } };

const mockTx = {
  profileVersion: {
    findUnique: () => Promise.resolve(mockVersion),
    create: () => Promise.resolve({}),
  },
  workspace: {
    findUnique: (args: FindUniqueArgs) => {
      if (args.where?.id) return Promise.resolve(mockWorkspace);
      if (args.where?.username) return Promise.resolve(mockClaimingWorkspace);
      return Promise.resolve(null);
    },
    update: () => Promise.resolve({}),
  },
  workspaceMember: {
    findFirst: () => Promise.resolve(mockOwnerMember),
  },
  workspaceAlias: {
    findUnique: () => Promise.resolve(mockAlias),
    upsert: () => Promise.resolve({}),
  },
  profileDraft: {
    deleteMany: () => Promise.resolve({}),
  },
  profilePreviewToken: {
    updateMany: () => Promise.resolve({}),
  },
};

mock.module("@/lib/prisma", {
  namedExports: {
    prisma: {
      $transaction: (fn: (tx: typeof mockTx) => unknown) => fn(mockTx),
    },
  },
});

let rollbackProfileVersion: any;

before(async () => {
  const workflow = await import("@/lib/profileWorkflow");
  rollbackProfileVersion = workflow.rollbackProfileVersion;
});

function versionWithUsername(username: string) {
  return {
    id: "version-1",
    workspaceId: "workspace-A",
    snapshot: {
      name: "Workspace A",
      username,
      bio: "old bio",
      image: null,
      themeType: null,
      themeColor: null,
      themeCustom: null,
      backgroundImage: null,
    },
  };
}

function currentWorkspace(username: string) {
  return {
    name: "Workspace A",
    username,
    bio: "new bio",
    backgroundImage: null,
    themeType: null,
    themeColor: null,
    themeCustom: null,
  };
}

test("rollback succeeds when username is unchanged", async () => {
  mockVersion = versionWithUsername("coolprofile");
  mockWorkspace = currentWorkspace("coolprofile");
  mockOwnerMember = { userId: "user-A", user: { image: null } };
  mockClaimingWorkspace = null;
  mockAlias = null;

  const result = await rollbackProfileVersion("workspace-A", "version-1");
  assert.equal(result.snapshot.username, "coolprofile");
  assert.deepEqual(result.diff.bio, { before: "new bio", after: "old bio" });
});

test("rollback fails when target username is claimed by another workspace as primary username", async () => {
  mockVersion = versionWithUsername("coolprofile");
  mockWorkspace = currentWorkspace("differentprofile");
  mockOwnerMember = { userId: "user-A", user: { image: null } };
  // Workspace B owns "coolprofile" as its primary username.
  mockClaimingWorkspace = { id: "workspace-B", username: "coolprofile" };
  mockAlias = null;

  await assert.rejects(
    rollbackProfileVersion("workspace-A", "version-1"),
    (err: Error) => {
      assert.equal(err.message, "The username in this profile version is no longer available.");
      return true;
    }
  );
});

test("rollback fails when target username is claimed by another workspace as an alias", async () => {
  mockVersion = versionWithUsername("coolprofile");
  mockWorkspace = currentWorkspace("differentprofile");
  mockOwnerMember = { userId: "user-A", user: { image: null } };
  mockClaimingWorkspace = null;
  // Workspace B owns the alias "coolprofile".
  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    workspaceId: "workspace-B",
  };

  await assert.rejects(
    rollbackProfileVersion("workspace-A", "version-1"),
    (err: Error) => {
      assert.equal(err.message, "The username in this profile version is no longer available.");
      return true;
    }
  );
});

test("rollback succeeds when target username is an alias owned by the same workspace", async () => {
  mockVersion = versionWithUsername("coolprofile");
  mockWorkspace = currentWorkspace("differentprofile");
  mockOwnerMember = { userId: "user-A", user: { image: null } };
  mockClaimingWorkspace = null;
  // Workspace A owns the alias "coolprofile" (its own previous username).
  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    workspaceId: "workspace-A",
  };

  const result = await rollbackProfileVersion("workspace-A", "version-1");
  assert.equal(result.snapshot.username, "coolprofile");
});
