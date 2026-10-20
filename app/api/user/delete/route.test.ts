import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import bcrypt from "bcryptjs";

let mockSession: unknown = null;
let mockUser: unknown = null;
const callOrder: string[] = [];
const invalidatedWorkspaceIds: string[] = [];
const invalidatedUsernames: string[] = [];

mock.module("next-auth", {
  namedExports: {
    getServerSession: () => Promise.resolve(mockSession),
  },
});

mock.module("@/lib/auth", {
  namedExports: { authOptions: {} },
});

// The route deletes the account, then purges every workspace the user was a
// member of (app/api/user/delete/route.ts:84-102), so the double needs
// workspaceMember.findMany as well as the user operations. A solo workspace is
// used so the route deletes it instead of promoting another member.
const prismaMock = {
  user: {
    findUnique: () => Promise.resolve(mockUser),
    delete: () => {
      callOrder.push("deleteUser");
      return Promise.resolve({});
    },
  },
  workspaceMember: {
    findMany: () =>
      Promise.resolve([
        {
          id: "membership-1",
          role: "OWNER",
          workspace: {
            id: "workspace-1",
            username: "test-user",
            members: [],
          },
        },
      ]),
    update: () => Promise.resolve({}),
  },
  workspace: {
    deleteMany: () => Promise.resolve({ count: 1 }),
  },
  $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
};

mock.module("@/lib/prisma", {
  defaultExport: prismaMock,
  namedExports: { prisma: prismaMock },
});

mock.module("@/lib/profileCache", {
  namedExports: {
    invalidateProfileCache: (workspaceId: string) => {
      invalidatedWorkspaceIds.push(workspaceId);
      return Promise.resolve();
    },
    invalidateProfileUsername: (username: string) => {
      invalidatedUsernames.push(username);
      return Promise.resolve();
    },
  },
});

mock.module("@/lib/deleteOtpStore", {
  namedExports: {
    verifyOtp: () => Promise.resolve({ valid: true }),
    clearOtp: () => {
      callOrder.push("clearOtp");
      return Promise.resolve({});
    },
  },
});

mock.module("@/lib/sessionInvalidation", {
  namedExports: {
    invalidateUserSessions: () => {
      callOrder.push("invalidateUserSessions");
      return Promise.resolve({});
    },
  },
});

// Mock the compare method on the shared bcryptjs instance
mock.method(bcrypt, "compare", () => Promise.resolve(true));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DELETE: (...args: any[]) => Promise<Response>;

before(async () => {
  const route = await import("@/app/api/user/delete/route");
  DELETE = route.DELETE;
});

function deleteRequest(body: unknown): Request {
  return new Request("http://localhost/api/user/delete", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("DELETE 401 — no session", async () => {
  mockSession = null;
  const res = await DELETE(deleteRequest({ otp: "123456" }));
  assert.equal(res.status, 401);
});

test("DELETE 200 — performs cleanups and deletes user in the correct order", async () => {
  mockSession = { user: { id: "test-user-id" } };
  mockUser = { id: "test-user-id", password: "hashedpassword", email: "user@example.com" };
  callOrder.length = 0;
  invalidatedWorkspaceIds.length = 0;
  invalidatedUsernames.length = 0;

  const res = await DELETE(deleteRequest({ password: "password123", otp: "123456" }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.deepEqual(callOrder, ["invalidateUserSessions", "clearOtp", "deleteUser"]);

  // The public profile cache is keyed by workspace id; the deleted workspace
  // and its username index must be purged with those ids.
  assert.deepEqual(invalidatedWorkspaceIds, ["workspace-1"]);
  assert.deepEqual(invalidatedUsernames, ["test-user"]);
});
