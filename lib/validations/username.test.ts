import assert from "node:assert/strict";
import { test } from "node:test";

import { validateUsername } from "@/lib/validations/username";

test("rejects a reserved username", () => {
    const result = validateUsername("login");
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /reserved/i);
});

test("rejects a reserved username with different casing", () => {
    const result = validateUsername("AdMiN");
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /reserved/i);
});

test("still accepts a normal username", () => {
    assert.deepEqual(validateUsername("alice-dev"), { valid: true });
});

test("keeps the existing charset and length errors", () => {
    assert.equal(validateUsername("alice dev").valid, false);
    assert.equal(validateUsername("ab").valid, false);
    assert.equal(validateUsername("a".repeat(31)).valid, false);
});
