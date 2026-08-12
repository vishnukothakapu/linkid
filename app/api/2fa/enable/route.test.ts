import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

// ── Mutable state shared across mock closures ─────────────────────────────────
let mockSession: unknown = null;
let mockUser: unknown = null;
let capturedUpdateArgs: unknown = null;
let rateLimited = false;
let codeValid = true;
let mockRecoveryCodes: string[] = [];

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
        verifyTotpCode: () =>
            Promise.resolve({
                valid: codeValid,
                timeStep: codeValid ? 12345 : undefined,
            }),
        generateRecoveryCodes: () => mockRecoveryCodes,
        hashRecoveryCodes: (codes: string[]) => codes.map((c) => `hash:${c}`).join("\n"),
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
    const route = await import("@/app/api/2fa/enable/route");
    POST = route.POST;
});

function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/2fa/enable", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

function defaultUser() {
    return {
        id: "user-1",
        totpSecret: "FAKE2FASECRET",
        twoFactorEnabled: false,
    };
}

test("returns 401 when unauthorized", async () => {
    mockSession = null;
    const res = await POST(makeReq({ code: "123456" }));
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

    const res = await POST(makeReq({}));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Verification code is required"
    );
});

test("returns 400 when 2FA is already enabled", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = { ...defaultUser(), twoFactorEnabled: true };

    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Two-factor authentication is already enabled."
    );
});

test("returns 400 when there is no pending secret", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = { ...defaultUser(), totpSecret: null };

    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "No pending setup found. Generate a new secret first."
    );
});

test("returns 400 for an invalid verification code", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();
    codeValid = false;

    const res = await POST(makeReq({ code: "000000" }));
    assert.equal(res.status, 400);
    assert.equal(
        (await res.json()).error,
        "Invalid verification code. Please try again."
    );
});

test("enables 2FA and stores hashed recovery codes", async () => {
    mockSession = { user: { id: "user-1" } };
    mockUser = defaultUser();
    codeValid = true;
    mockRecoveryCodes = ["ABC2345678", "XYZ9876543"];
    capturedUpdateArgs = null;

    const res = await POST(makeReq({ code: "123456" }));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.deepEqual(data.recoveryCodes, mockRecoveryCodes);

    assert.deepEqual(capturedUpdateArgs, {
        where: { id: "user-1" },
        data: {
            twoFactorEnabled: true,
            recoveryCodes: "hash:ABC2345678\nhash:XYZ9876543",
            lastTotpStep: 12345,
        },
    });
});
