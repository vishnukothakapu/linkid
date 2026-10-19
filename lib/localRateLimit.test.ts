import assert from "node:assert/strict";
import test from "node:test";

import {
    checkLocalRateLimit,
    localRateLimitStoreSize,
} from "@/lib/localRateLimit";

const MINUTE = 60_000;

test("allows up to the limit inside one bucket, then blocks", () => {
    const now = 16 * MINUTE;
    const key = "fallback-block";

    assert.equal(checkLocalRateLimit(key, 3, now), true);
    assert.equal(checkLocalRateLimit(key, 3, now), true);
    assert.equal(checkLocalRateLimit(key, 3, now), true);
    assert.equal(checkLocalRateLimit(key, 3, now), false);
    assert.equal(checkLocalRateLimit(key, 3, now), false);
});

test("different keys do not share a budget", () => {
    const now = 17 * MINUTE;

    assert.equal(checkLocalRateLimit("indep-a", 1, now), true);
    assert.equal(checkLocalRateLimit("indep-b", 1, now), true);
    assert.equal(checkLocalRateLimit("indep-a", 1, now), false);
    assert.equal(checkLocalRateLimit("indep-b", 1, now), false);
});

test("a new minute starts a fresh window for the same key", () => {
    const first = 18 * MINUTE;
    const next = first + MINUTE;
    const key = "rollover";

    assert.equal(checkLocalRateLimit(key, 1, first), true);
    assert.equal(checkLocalRateLimit(key, 1, first), false);
    assert.equal(checkLocalRateLimit(key, 1, next), true);
});

test("expired minute buckets are swept away", () => {
    const now = 20 * MINUTE;

    for (let i = 0; i < 8; i++) {
        checkLocalRateLimit(`sweep-${i}`, 5, now);
    }
    assert.ok(localRateLimitStoreSize() >= 8, "expected the buckets to exist before the sweep");

    // Move two minutes forward and pump enough requests to trigger a sweep.
    const later = now + 2 * MINUTE;
    for (let i = 0; i < 500; i++) {
        checkLocalRateLimit("sweep-current", 1000, later);
    }

    // Every bucket from the old minute is gone; only the current one remains.
    assert.equal(localRateLimitStoreSize(), 1);
});
