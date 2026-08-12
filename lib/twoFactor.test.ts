import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSecret, generateSync } from "otplib";
import {
    buildOtpAuthUri,
    consumeRecoveryCode,
    generateRecoveryCodes,
    hashRecoveryCode,
    hashRecoveryCodes,
    verifyTotpCode,
    TWO_FACTOR_ISSUER,
    RECOVERY_CODES_COUNT,
} from "@/lib/twoFactor";

test("verifyTotpCode accepts the current code for a secret", () => {
    const secret = generateSecret();
    const code = generateSync({ secret });

    assert.equal(verifyTotpCode(secret, code), true);
});

test("verifyTotpCode rejects an invalid code", () => {
    const secret = generateSecret();

    assert.equal(verifyTotpCode(secret, "000000"), false);
});

test("verifyTotpCode rejects malformed input", () => {
    const secret = generateSecret();

    assert.equal(verifyTotpCode(secret, "12345"), false);
    assert.equal(verifyTotpCode(secret, "abcdef"), false);
    assert.equal(verifyTotpCode(secret, ""), false);
    assert.equal(verifyTotpCode(secret, "1234567"), false);
});

test("verifyTotpCode accepts codes with surrounding whitespace", () => {
    const secret = generateSecret();
    const code = generateSync({ secret });

    assert.equal(verifyTotpCode(secret, ` ${code} `), true);
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

test("hashRecoveryCodes stores hashed codes, not plaintext", () => {
    const codes = generateRecoveryCodes();
    const hashed = hashRecoveryCodes(codes);

    assert.notEqual(hashed, codes.join("\n"));
    assert.equal(hashed.split("\n").length, codes.length);
    assert.equal(hashed.includes(codes[0]), false);
});

test("consumeRecoveryCode returns remaining codes after a match", () => {
    const codes = generateRecoveryCodes(3);
    const hashed = hashRecoveryCodes(codes);

    const remaining = consumeRecoveryCode(hashed, codes[0]);
    assert.ok(remaining !== null);
    assert.equal(remaining.includes(hashRecoveryCode(codes[0])), false);
    assert.equal(remaining.split("\n").length, 2);
});

test("consumeRecoveryCode is case-insensitive", () => {
    const codes = generateRecoveryCodes(2);
    const hashed = hashRecoveryCodes(codes);

    const remaining = consumeRecoveryCode(hashed, codes[0].toLowerCase());
    assert.ok(remaining !== null);
    assert.equal(remaining.split("\n").length, 1);
});

test("consumeRecoveryCode rejects unknown codes", () => {
    const codes = generateRecoveryCodes(1);
    const hashed = hashRecoveryCodes(codes);

    assert.equal(consumeRecoveryCode(hashed, "ABCDEFGHIJ"), null);
    assert.equal(consumeRecoveryCode(hashed, ""), null);
    assert.equal(consumeRecoveryCode(null, "ABCDEFGHIJ"), null);
});

test("consumeRecoveryCode cannot reuse a consumed code", () => {
    const codes = generateRecoveryCodes(1);
    const hashed = hashRecoveryCodes(codes);

    const remaining = consumeRecoveryCode(hashed, codes[0]);
    assert.ok(remaining !== null);

    assert.equal(consumeRecoveryCode(remaining, codes[0]), null);
});
