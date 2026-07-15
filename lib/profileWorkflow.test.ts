import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let mockVersion: any = null;
let mockCurrentUser: any = null;
let mockClaimingUser: any = null;
let mockAlias: any = null;

const mockTx = {
  profileVersion: {
    findUnique: () => Promise.resolve(mockVersion),
    create: () => Promise.resolve({}),
  },
  user: {
    findUnique: (args: any) => {
      if (args.where.id) {
        return Promise.resolve(mockCurrentUser);
      }
      if (args.where.username) {
        return Promise.resolve(mockClaimingUser);
      }
      return Promise.resolve(null);
    },
    update: () => Promise.resolve({}),
  },
  userAlias: {
    findUnique: (args: any) => {
      return Promise.resolve(mockAlias);
    },
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
      $transaction: (fn: any) => fn(mockTx),
    },
  },
});

let rollbackProfileVersion: any;

before(async () => {
  const workflow = await import("@/lib/profileWorkflow");
  rollbackProfileVersion = workflow.rollbackProfileVersion;
});

test("rollback succeeds when username is unchanged", async () => {
  mockVersion = {
    id: "version-1",
    userId: "user-A",
    name: "User A",
    username: "coolprofile",
    bio: "old bio",
    image: null,
  };
  mockCurrentUser = {
    id: "user-A",
    name: "User A",
    username: "coolprofile",
    bio: "new bio",
    image: null,
  };
  mockClaimingUser = null;
  mockAlias = null;

  const result = await rollbackProfileVersion("user-A", "version-1");
  assert.equal(result.snapshot.username, "coolprofile");
  assert.deepEqual(result.diff.bio, { before: "new bio", after: "old bio" });
});

test("rollback fails when target username is claimed by another user as primary username", async () => {
  mockVersion = {
    id: "version-1",
    userId: "user-A",
    name: "User A",
    username: "coolprofile",
    bio: "old bio",
    image: null,
  };
  mockCurrentUser = {
    id: "user-A",
    name: "User A",
    username: "differentprofile",
    bio: "new bio",
    image: null,
  };
  // User B has claimed "coolprofile"
  mockClaimingUser = {
    id: "user-B",
    username: "coolprofile",
  };
  mockAlias = null;

  await assert.rejects(
    rollbackProfileVersion("user-A", "version-1"),
    (err: Error) => {
      assert.equal(err.message, "The username in this profile version is no longer available.");
      return true;
    }
  );
});

test("rollback fails when target username is claimed by another user as an alias", async () => {
  mockVersion = {
    id: "version-1",
    userId: "user-A",
    name: "User A",
    username: "coolprofile",
    bio: "old bio",
    image: null,
  };
  mockCurrentUser = {
    id: "user-A",
    name: "User A",
    username: "differentprofile",
    bio: "new bio",
    image: null,
  };
  mockClaimingUser = null;
  // User B owns the alias "coolprofile"
  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    userId: "user-B",
  };

  await assert.rejects(
    rollbackProfileVersion("user-A", "version-1"),
    (err: Error) => {
      assert.equal(err.message, "The username in this profile version is no longer available.");
      return true;
    }
  );
});

test("rollback succeeds when target username is an alias owned by the same user", async () => {
  mockVersion = {
    id: "version-1",
    userId: "user-A",
    name: "User A",
    username: "coolprofile",
    bio: "old bio",
    image: null,
  };
  mockCurrentUser = {
    id: "user-A",
    name: "User A",
    username: "differentprofile",
    bio: "new bio",
    image: null,
  };
  mockClaimingUser = null;
  // User A owns the alias "coolprofile" (it's their own alias)
  mockAlias = {
    id: "alias-1",
    username: "coolprofile",
    userId: "user-A",
  };

  const result = await rollbackProfileVersion("user-A", "version-1");
  assert.equal(result.snapshot.username, "coolprofile");
});
