import assert from "node:assert/strict";
import test from "node:test";

import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";

test("generateCsrfToken returns a 64-character hex string", () => {
    const token = generateCsrfToken();

    assert.match(token, /^[a-f0-9]{64}$/);
});

test("generateCsrfToken returns unique values", () => {
    const firstToken = generateCsrfToken();
    const secondToken = generateCsrfToken();

    assert.notEqual(firstToken, secondToken);
});

test("validateCsrfToken accepts matching tokens", () => {
    const token = generateCsrfToken();

    assert.equal(validateCsrfToken(token, token), true);
});

test("validateCsrfToken rejects missing or mismatched tokens", () => {
    const token = generateCsrfToken();

    assert.equal(validateCsrfToken(token, generateCsrfToken()), false);
    assert.equal(validateCsrfToken(token, null), false);
    assert.equal(validateCsrfToken(null, token), false);
});
