import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSecret, generateSync } from "otplib";
import bcrypt from "bcryptjs";
import {
    buildOtpAuthUri,
    consumeRecoveryCode,
    generateRecoveryCodes,
    hashRecoveryCodes,
    verifyTotpCode,
    TWO_FACTOR_ISSUER,
    RECOVERY_CODES_COUNT,
} from "@/lib/twoFactor";

test("verifyTotpCode accepts the current code for a secret", async () => {
    const secret = generateSecret();
    const code = generateSync({ secret });

    const result = await verifyTotpCode(secret, code);
    assert.equal(result.valid, true);
    assert.equal(typeof result.timeStep, "number");
});

test("verifyTotpCode rejects an invalid code", async () => {
    const secret = generateSecret();

    assert.equal((await verifyTotpCode(secret, "000000")).valid, false);
});

test("verifyTotpCode rejects malformed input", async () => {
    const secret = generateSecret();

    assert.equal((await verifyTotpCode(secret, "12345")).valid, false);
    assert.equal((await verifyTotpCode(secret, "abcdef")).valid, false);
    assert.equal((await verifyTotpCode(secret, "")).valid, false);
    assert.equal((await verifyTotpCode(secret, "1234567")).valid, false);
});

test("verifyTotpCode accepts codes with surrounding whitespace", async () => {
    const secret = generateSecret();
    const code = generateSync({ secret });

    assert.equal((await verifyTotpCode(secret, ` ${code} `)).valid, true);
});

test("verifyTotpCode rejects a code from a previously used time step", async () => {
    const secret = generateSecret();
    const code = generateSync({ secret });

    const first = await verifyTotpCode(secret, code);
    assert.equal(first.valid, true);

    assert.equal(
        (await verifyTotpCode(secret, code, first.timeStep)).valid,
        false
    );
});

test("buildOtpAuthUri produces an otpauth URI with issuer and account", () => {
    const secret = generateSecret();
    const uri = buildOtpAuthUri(secret, "user@example.com");

    assert.ok(uri.startsWith("otpauth://totp/"));
    assert.ok(uri.includes(`issuer=${encodeURIComponent(TWO_FACTOR_ISSUER)}`));
    assert.ok(uri.includes(`secret=${secret}`));
});

test("generateRecoveryCodes returns unique uppercase codes", () => {
    const codes = generateRecoveryCodes();

    assert.equal(codes.length, RECOVERY_CODES_COUNT);
    assert.equal(new Set(codes).size, codes.length);
    for (const code of codes) {
        assert.match(code, /^[A-Z2-9]{10}$/);
    }
});

test("hashRecoveryCodes stores hashed codes, not plaintext", async () => {
    const codes = generateRecoveryCodes();
    const hashed = await hashRecoveryCodes(codes);

    assert.notEqual(hashed, codes.join("\n"));
    assert.equal(hashed.split("\n").length, codes.length);
    assert.equal(hashed.includes(codes[0]), false);
    assert.match(
        hashed,
        /^[A-Z2-9]{4}:\$2[aby]\$10\$/,
        "each entry is a prefixed bcrypt hash"
    );
});

test("consumeRecoveryCode handles legacy bare-hash entries", async () => {
    const code = generateRecoveryCodes(1)[0];
    const normalized = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const legacyHash = await bcrypt.hash(normalized, 10);

    const remaining = await consumeRecoveryCode(legacyHash, code);
    assert.equal(remaining, "");
    assert.equal(await consumeRecoveryCode(remaining, code), null);
});

test("consumeRecoveryCode returns remaining codes after a match", async () => {
    const codes = generateRecoveryCodes(3);
    const hashed = await hashRecoveryCodes(codes);

    const remaining = await consumeRecoveryCode(hashed, codes[0]);
    assert.ok(remaining !== null);
    assert.equal(remaining.split("\n").length, 2);

    assert.equal(await consumeRecoveryCode(remaining, codes[0]), null);
    assert.equal((await consumeRecoveryCode(remaining, codes[1]))?.split("\n").length, 1);
});

test("consumeRecoveryCode is case-insensitive", async () => {
    const codes = generateRecoveryCodes(2);
    const hashed = await hashRecoveryCodes(codes);

    const remaining = await consumeRecoveryCode(hashed, codes[0].toLowerCase());
    assert.ok(remaining !== null);
    assert.equal(remaining.split("\n").length, 1);
});

test("consumeRecoveryCode accepts dashed or grouped input", async () => {
    const codes = generateRecoveryCodes(2);
    const hashed = await hashRecoveryCodes(codes);

    const raw = codes[0];
    const dashed = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    const grouped = `${raw.slice(0, 3)} ${raw.slice(3)}`;

    assert.equal((await consumeRecoveryCode(hashed, dashed))?.split("\n").length, 1);
    assert.equal((await consumeRecoveryCode(hashed, grouped))?.split("\n").length, 1);
});

test("consumeRecoveryCode rejects unknown codes", async () => {
    const codes = generateRecoveryCodes(1);
    const hashed = await hashRecoveryCodes(codes);

    assert.equal(await consumeRecoveryCode(hashed, "ABCDEFGHIJ"), null);
    assert.equal(await consumeRecoveryCode(hashed, ""), null);
    assert.equal(await consumeRecoveryCode(null, "ABCDEFGHIJ"), null);
});

test("consumeRecoveryCode cannot reuse a consumed code", async () => {
    const codes = generateRecoveryCodes(1);
    const hashed = await hashRecoveryCodes(codes);

    const remaining = await consumeRecoveryCode(hashed, codes[0]);
    assert.ok(remaining !== null);

    assert.equal(await consumeRecoveryCode(remaining, codes[0]), null);
});
