
import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let mockVersion: any = null;
let mockWorkspace: any = null;
let mockClaimingWorkspace: any = null;
let mockAlias: any = null;

const mockTx = {
  $queryRaw: () => Promise.resolve([]),

  profileVersion: {
    findUnique: () => Promise.resolve(mockVersion),
    create: () => Promise.resolve({}),
  },

  workspace: {
    findUnique: (args: any) => {
      if (args.where.id) {
        return Promise.resolve(mockWorkspace);
      }
      if (args.where.username) {
        return Promise.resolve(mockClaimingWorkspace);
      }
      return Promise.resolve(null);
    },
    update: () => Promise.resolve({}),
  },

  workspaceAlias: {
    findUnique: () => Promise.resolve(mockAlias),
    create: () => Promise.resolve({}),
  },

  workspaceMember: {
    findFirst: () => Promise.resolve(null),
  },

  user: {
    update: () => Promise.resolve({}),
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
      $transaction: (fn: any) => fn(mockTx),
    },
  },
});

let rollbackProfileVersion: any;

before(async () => {
  const workflow = await import("@/lib/profileWorkflow");
  rollbackProfileVersion = workflow.rollbackProfileVersion;
});

function setupMocks() {
 mockVersion = {
  id: "version-1",
  workspaceId: "workspace-A",
  snapshot: {
    name: "Workspace A",
    username: "coolprofile",
    bio: "old bio",
    image: null,
    themeType: "solid",
    themeColor: "slate",
    themeCustom: null,
    backgroundImage: null,
  },
};
  mockWorkspace = {
    name: "Workspace A",
    username: "coolprofile",
    bio: "new bio",
    image: null,
    themeType: "solid",
    themeColor: "slate",
    themeCustom: null,
    backgroundImage: null,
  };

  mockClaimingWorkspace = null;
  mockAlias = null;
}

test("rollback succeeds when username is unchanged", async () => {
  setupMocks();

  const result = await rollbackProfileVersion(
    "workspace-A",
    "version-1"
  );

  assert.equal(result.snapshot.username, "coolprofile");
  assert.deepEqual(result.diff.bio, {
    before: "new bio",
    after: "old bio",
  });
});

test("rollback fails when target username is claimed by another workspace as primary username", async () => {
  setupMocks();

  mockWorkspace.username = "differentprofile";

  mockClaimingWorkspace = {
    id: "workspace-B",
    username: "coolprofile",
  };

  await assert.rejects(
    rollbackProfileVersion("workspace-A", "version-1"),
    (err: Error) => {
      assert.equal(
        err.message,
        "The username in this profile version is no longer available."
      );
      return true;
    }
  );
});

test("rollback fails when target username is claimed by another workspace as an alias", async () => {
  setupMocks();

  mockWorkspace.username = "differentprofile";

  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    workspaceId: "workspace-B",
  };

  await assert.rejects(
    rollbackProfileVersion("workspace-A", "version-1"),
    (err: Error) => {
      assert.equal(
        err.message,
        "The username in this profile version is no longer available."
      );
      return true;
    }
  );
});

test("rollback succeeds when target username is an alias owned by the same workspace", async () => {
  setupMocks();

  mockWorkspace.username = "differentprofile";

  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    workspaceId: "workspace-A",
  };

  const result = await rollbackProfileVersion(
    "workspace-A",
    "version-1"
  );

  assert.equal(result.snapshot.username, "coolprofile");
});
