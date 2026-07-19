/* eslint-disable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// Mock heavy server-only dependencies BEFORE anything imports @/lib/prisma.
// We intercept Node's module resolution so that:
//   - "server-only" resolves to the built-in "path" module (no side-effects)
//   - "@/lib/prisma" resolves to our lightweight mock (__mocks__/prisma.ts)
// ---------------------------------------------------------------------------
const path = require("path");
const Module = require("module");
const _origResolve: (...args: unknown[]) => string =
  Module._resolveFilename;

const MOCK_DIR = path.join(__dirname, "__mocks__");

Module._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) {
  if (request === "server-only") {
    return _origResolve.call(this, "path", parent, isMain, options);
  }
  // Redirect @/lib/prisma to our test mock
  if (request === "@/lib/prisma") {
    return path.join(MOCK_DIR, "prisma.ts");
  }
  return _origResolve.call(this, request, parent, isMain, options);
};

const assert = require("node:assert/strict");
const { test, mock, after } = require("node:test");

// Safe to import now – heavy deps are redirected.
const prisma = require("@/lib/prisma").default;
const {
  generateOtp,
  setOtp,
  verifyOtp,
  checkRateLimit,
} = require("@/lib/deleteOtpStore");

// ---------------------------------------------------------------------------
// In-memory store that backs the mocked Prisma DeleteOtp methods.
// ---------------------------------------------------------------------------
const store: Map<string, Record<string, unknown>> = new Map();

function resetStore() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Mock every Prisma method used by deleteOtpStore so the tests never touch
// a real database.  Because both this file and deleteOtpStore resolve
// "@/lib/prisma" to the same cached module, replacing methods here is
// visible to the functions under test (they access properties at call time).
// ---------------------------------------------------------------------------
mock.method(
  prisma.deleteOtp,
  "findUnique",
  async ({ where }: { where: { userId: string } }) => {
    return store.get(where.userId) ?? null;
  },
);

mock.method(
  prisma.deleteOtp,
  "upsert",
  async ({
    where,
    update,
    create,
  }: {
    where: { userId: string };
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }) => {
    const existing = store.get(where.userId);
    if (existing) {
      Object.assign(existing, update);
      return existing;
    }
    const entry: Record<string, unknown> = { userId: where.userId, ...create };
    store.set(where.userId, entry);
    return entry;
  },
);

mock.method(
  prisma.deleteOtp,
  "update",
  async ({
    where,
    data,
  }: {
    where: { userId: string };
    data: Record<string, unknown>;
  }) => {
    const entry = store.get(where.userId);
    if (!entry) throw new Error("Record not found");
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === "object" &&
        value !== null &&
        "increment" in (value as Record<string, unknown>)
      ) {
        entry[key] =
          ((entry[key] as number) || 0) +
          ((value as { increment: number }).increment);
      } else {
        entry[key] = value;
      }
    }
    return entry;
  },
);

mock.method(
  prisma.deleteOtp,
  "delete",
  async ({ where }: { where: { userId: string } }) => {
    store.delete(where.userId);
  },
);

after(() => {
  mock.restoreAll();
});

// ===== generateOtp ========================================================

test("generateOtp returns a 6-digit numeric string", () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);
});

test("generateOtp returns different values on successive calls", () => {
  const first = generateOtp();
  const second = generateOtp();
  assert.notEqual(first, second);
});

// ===== checkRateLimit – rate limiting ======================================

test("checkRateLimit: first OTP request succeeds", async () => {
  resetStore();
  assert.equal(await checkRateLimit("u1"), true);
});

test("checkRateLimit: second OTP request succeeds", async () => {
  resetStore();
  await checkRateLimit("u1");
  assert.equal(await checkRateLimit("u1"), true);
});

test("checkRateLimit: third OTP request succeeds", async () => {
  resetStore();
  await checkRateLimit("u1");
  await checkRateLimit("u1");
  assert.equal(await checkRateLimit("u1"), true);
});

test("checkRateLimit: fourth request is rejected", async () => {
  resetStore();
  await checkRateLimit("u1");
  await checkRateLimit("u1");
  await checkRateLimit("u1");
  assert.equal(await checkRateLimit("u1"), false);
});

// ===== verifyOtp ==========================================================

const CORRECT_OTP = "123456";
const WRONG_OTP = "000000";

test("verifyOtp: correct OTP succeeds", async () => {
  resetStore();
  await setOtp("u2", CORRECT_OTP);
  const result = await verifyOtp("u2", CORRECT_OTP);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test("verifyOtp: incorrect OTP increments attempts", async () => {
  resetStore();
  await setOtp("u3", CORRECT_OTP);
  const result = await verifyOtp("u3", WRONG_OTP);
  assert.equal(result.valid, false);
  assert.match(result.error!, /Incorrect verification code/);
  assert.match(result.error!, /2 attempts? remaining/);
});

test("verifyOtp: verification blocked after three failed attempts", async () => {
  resetStore();
  await setOtp("u4", CORRECT_OTP);
  await verifyOtp("u4", WRONG_OTP); // attempt 1
  await verifyOtp("u4", WRONG_OTP); // attempt 2
  const result = await verifyOtp("u4", WRONG_OTP); // attempt 3
  assert.equal(result.valid, false);
  assert.match(result.error!, /Too many failed attempts/);
});

test("verifyOtp: OTP cleared after maximum failed attempts", async () => {
  resetStore();
  await setOtp("u5", CORRECT_OTP);
  await verifyOtp("u5", WRONG_OTP);
  await verifyOtp("u5", WRONG_OTP);
  await verifyOtp("u5", WRONG_OTP); // triggers clear
  // Subsequent attempt finds no OTP
  const result = await verifyOtp("u5", CORRECT_OTP);
  assert.equal(result.valid, false);
  assert.match(result.error!, /expired or not requested/);
});

// ===== edge cases =========================================================

test("verifyOtp: expired OTP is rejected", async () => {
  resetStore();
  await setOtp("u6", CORRECT_OTP);
  // Manually back-date the expiry
  const entry = store.get("u6")!;
  entry.expiresAt = new Date(Date.now() - 1000);
  const result = await verifyOtp("u6", CORRECT_OTP);
  assert.equal(result.valid, false);
  assert.match(result.error!, /expired/);
});

test("verifyOtp: new OTP resets attempts", async () => {
  resetStore();
  await setOtp("u7", CORRECT_OTP);
  await verifyOtp("u7", WRONG_OTP); // attempt 1
  await verifyOtp("u7", WRONG_OTP); // attempt 2
  // Issue a fresh OTP – should reset attempt counter
  const newOtp = "654321";
  await setOtp("u7", newOtp);
  const result = await verifyOtp("u7", newOtp);
  assert.equal(result.valid, true);
});

test("checkRateLimit: rate limit resets after time window", async () => {
  resetStore();
  await checkRateLimit("u8");
  await checkRateLimit("u8");
  await checkRateLimit("u8"); // at limit
  // Simulate window expiry
  const entry = store.get("u8")!;
  entry.windowStart = new Date(Date.now() - 11 * 60 * 1000);
  assert.equal(await checkRateLimit("u8"), true);
});
