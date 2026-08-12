import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockUser: unknown = null;
let capturedUpdateArgs: unknown = null;
let rateLimited = false;
let totpValid = false;
let recoveryConsumeResult: string | null = null;

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
        verifyTotpCode: () => totpValid,
        consumeRecoveryCode: () => recoveryConsumeResult,
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
    const route = await import("@/app/api/2fa/disable/route");
    POST = route.POST;
});

function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/2fa/disable", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

function defaultUser() {
    return {
        id: "user-1",
        email: "test@example.com",
        password: bcrypt.hashSync("correct-password", 10),
        totpSecret: "FAKE2FASECRET",
        twoFactorEnabled: true,
        recoveryCodes: "hash:ABC2345678",
    };
}

test("returns 401 when unauthorized", async () => {
    mockSession = null;
    const res = await POST(makeReq({ password: "x", code: "123456" }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "Unauthorized");
});

test("returns 429 when rate limited", async () => {
    mockSession = { user: { id: "user-1" } };
    rateLimited = true;
    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 429);
    rateLimited = false;
});

test("returns 400 when the code is missing", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();

    const res = await POST(makeReq({ password: "correct-password" }));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Verification code is required"
    );
});

test("returns 400 when 2FA is not enabled", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = { ...defaultUser(), twoFactorEnabled: false };

    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Two-factor authentication is not enabled."
    );
});

test("returns 400 when the password is missing", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();

    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Password is required");
});

test("returns 403 for an incorrect password", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();

    const res = await POST(makeReq({ password: "wrong-password", code: "123456" }));
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error, "Incorrect password");
});

test("returns 400 when neither TOTP nor a recovery code matches", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();
    totpValid = false;
    recoveryConsumeResult = null;

    const res = await POST(makeReq({ password: "correct-password", code: "000000" }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Invalid verification code.");
});

test("disables 2FA after a valid TOTP code", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();
    totpValid = true;
    recoveryConsumeResult = null;
    capturedUpdateArgs = null;

    const res = await POST(makeReq({ password: "correct-password", code: "123456" }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).success, true);

    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "user-1" },
        data: {
            totpSecret: null,
            twoFactorEnabled: false,
            recoveryCodes: null,
        },
    });
});

test("disables 2FA after a valid recovery code", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();
    totpValid = false;
    recoveryConsumeResult = "hash:XYZ9876543";
    capturedUpdateArgs = null;

    const res = await POST(makeReq({ password: "correct-password", code: "ABC2345678" }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).success, true);

    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "user-1" },
        data: {
            totpSecret: null,
            twoFactorEnabled: false,
            recoveryCodes: null,
        },
    });
});
