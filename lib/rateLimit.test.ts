import assert from "node:assert/strict";
import test from "node:test";

import { checkRateLimit } from "@/lib/rateLimit";

test("Global Rate Limit Reset Vulnerability check", async () => {
    // Ensure we are testing the in-memory backend by having UPSTASH_REDIS env variables unset
    const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
    const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    try {
        const longWindowKey = "test:endpointA:1.2.3.4";
        const shortWindowKey = "test:endpointB:1.2.3.4";

        const longWindowMs = 24 * 60 * 60 * 1000; // 24 hours
        const shortWindowMs = 60000; // 1 minute

        // 1. Consume rate limit on longWindowKey (limit = 2)
        const allowed1 = await checkRateLimit(longWindowKey, 2, longWindowMs);
        const allowed2 = await checkRateLimit(longWindowKey, 2, longWindowMs);
        const allowed3 = await checkRateLimit(longWindowKey, 2, longWindowMs);

        assert.equal(allowed1, true, "First request to long window should be allowed");
        assert.equal(allowed2, true, "Second request to long window should be allowed");
        assert.equal(allowed3, false, "Third request to long window should be blocked");

        // 2. Make 500 requests to shortWindowKey to trigger sweepExpiredKeys()
        // since CLEANUP_INTERVAL is 500.
        for (let i = 0; i < 500; i++) {
            await checkRateLimit(shortWindowKey, 1000, shortWindowMs);
        }

        // 3. Verify that the rate limit for longWindowKey has NOT been reset/swept away
        const allowedAfterSweep = await checkRateLimit(longWindowKey, 2, longWindowMs);
        assert.equal(allowedAfterSweep, false, "Long window request should still be blocked after sweep");
    } finally {
        // Restore environment variables
        if (oldUrl) process.env.UPSTASH_REDIS_REST_URL = oldUrl;
        if (oldToken) process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
    }
});
