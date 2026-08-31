import assert from "node:assert/strict";
import { mock, test, before } from "node:test";
import { NextRequest } from "next/server";

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

function makeReq() {
    return new NextRequest("http://localhost/api/2fa/setup", {
        method: "POST",
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
