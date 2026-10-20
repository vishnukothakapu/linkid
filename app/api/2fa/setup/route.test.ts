import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

const PASSWORD_HASH = bcrypt.hashSync("correct-password", 4);

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUser: any = null;
let capturedUpdateArgs: unknown = null;
let rateLimited = false;

// ── Register mocks synchronously BEFORE the route is imported ──────────────────
mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: () => Promise.resolve(!rateLimited),
    },
});

mock.module("@/lib/twoFactor", {
    namedExports: {
        generateTotpSecret: () => "FAKE2FASECRET",
        buildOtpAuthUri: () =>
            "otpauth://totp/LinkID:test%40example.com?secret=FAKE2FASECRET&issuer=LinkID",
        TWO_FACTOR_ISSUER: "LinkID",
    },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        user: {
            findUnique: () => Promise.resolve(mockUser),
            update: (args: unknown) => {
                capturedUpdateArgs = args;
                return Promise.resolve({ ...mockUser });
            },
        },
    },
    namedExports: {
        prisma: {
            user: {
                findUnique: () => Promise.resolve(mockUser),
                update: (args: unknown) => {
                    capturedUpdateArgs = args;
                    return Promise.resolve({ ...mockUser });
                },
            },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/2fa/setup/route");
    POST = route.POST;
});

function makeReq(body?: unknown) {
    return new NextRequest("http://localhost/api/2fa/setup", {
        method: "POST",
        ...(body === undefined
            ? {}
            : {
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(body),
              }),
    });
}

test("returns 401 when unauthorized", async () => {
    mockSession = null;
    const res = await POST(makeReq());
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "Unauthorized");
});

test("returns 429 when rate limited", async () => {
    mockSession = { user: { id: "user-1" } };
    rateLimited = true;
    const res = await POST(makeReq());
    assert.equal(res.status, 429);
    rateLimited = false;
});

test("returns 400 when 2FA is already enabled", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
    };

    const res = await POST(makeReq());
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Two-factor authentication is already enabled."
    );
});

test("returns secret and QR code for a fresh setup", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: false,
    };
    capturedUpdateArgs = null;

    const res = await POST(makeReq());
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.secret, "FAKE2FASECRET");
    assert.equal(data.issuer, "LinkID");
    assert.equal(data.accountName, "test@example.com");
    assert.ok(data.qrCodeUrl.startsWith("data:image/png;base64,"));

    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "user-1" },
        data: { totpSecret: "FAKE2FASECRET" },
    });
});

test("requires the current password before generating a secret", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        password: PASSWORD_HASH,
        twoFactorEnabled: false,
    };
    capturedUpdateArgs = null;

    const res = await POST(makeReq());
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Password confirmation is required");
    assert.equal(capturedUpdateArgs, null);
});

test("rejects a wrong current password", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        password: PASSWORD_HASH,
        twoFactorEnabled: false,
    };
    capturedUpdateArgs = null;

    const res = await POST(makeReq({ password: "wrong-password" }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "Password confirmation failed");
    assert.equal(capturedUpdateArgs, null);
});

test("starts setup with the correct current password", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        password: PASSWORD_HASH,
        twoFactorEnabled: false,
    };
    capturedUpdateArgs = null;

    const res = await POST(makeReq({ password: "correct-password" }));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.secret, "FAKE2FASECRET");
    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "user-1" },
        data: { totpSecret: "FAKE2FASECRET" },
    });
});

test("does not require a password for OAuth-only accounts", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = {
        id: "user-1",
        email: "test@example.com",
        password: null,
        twoFactorEnabled: false,
    };
    capturedUpdateArgs = null;

    const res = await POST(makeReq());
    assert.equal(res.status, 200);
    assert.equal((await res.json()).success, true);
});
