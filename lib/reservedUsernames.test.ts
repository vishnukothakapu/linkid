import assert from "node:assert/strict";
import { test } from "node:test";

import { getReservedUsernames, isReservedUsername } from "@/lib/reservedUsernames";

test("matches reserved names case-insensitively", () => {
    assert.equal(isReservedUsername("admin"), true);
    assert.equal(isReservedUsername("Admin"), true);
    assert.equal(isReservedUsername("DASHBOARD"), true);
});

test("ignores surrounding whitespace", () => {
    assert.equal(isReservedUsername("  login  "), true);
});

test("allows names that do not collide with a route or brand", () => {
    assert.equal(isReservedUsername("alice"), false);
    assert.equal(isReservedUsername("alice-dev"), false);
    assert.equal(isReservedUsername("admin1"), false);
});

test("the reserved list is lowercase and unique", () => {
    const names = getReservedUsernames();
    assert.equal(names.length, new Set(names).size);
    for (const name of names) {
        assert.equal(name, name.toLowerCase());
        assert.equal(name.trim(), name);
    }
});
