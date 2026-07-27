import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import bcrypt from "bcryptjs";

let mockSession: unknown = null;
let mockUser: unknown = null;
const callOrder: string[] = [];

mock.module("next-auth", {
  exports: {
    getServerSession: () => Promise.resolve(mockSession),
  },
});

mock.module("@/lib/auth", {
  exports: { authOptions: {} },
});

mock.module("@/lib/prisma", {
  exports: {
    default: {
      user: {
        findUnique: () => Promise.resolve(mockUser),
        delete: () => {
          callOrder.push("deleteUser");
          return Promise.resolve({});
        },
      },
    },
    prisma: {
      user: {
        findUnique: () => Promise.resolve(mockUser),
        delete: () => {
          callOrder.push("deleteUser");
          return Promise.resolve({});
        },
      },
    },
  },
});

mock.module("@/lib/deleteOtpStore", {
  exports: {
    verifyOtp: () => Promise.resolve({ valid: true }),
    clearOtp: () => {
      callOrder.push("clearOtp");
      return Promise.resolve({});
    },
  },
});

mock.module("@/lib/sessionInvalidation", {
  exports: {
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

  const res = await DELETE(deleteRequest({ password: "password123", otp: "123456" }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.deepEqual(callOrder, ["invalidateUserSessions", "clearOtp", "deleteUser"]);
});
