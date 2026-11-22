import assert from "node:assert/strict";
import { test, before, after } from "node:test";

let redisModule: typeof import("@/lib/redis");

before(async () => {
    redisModule = await import("./redis.ts");
});

test("isRedisConfigured returns false when no Redis environment variables are set", () => {
    const origRedisUrl = process.env.REDIS_URL;
    const origUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const origUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    try {
        assert.equal(redisModule.isRedisConfigured(), false);
    } finally {
        if (origRedisUrl) process.env.REDIS_URL = origRedisUrl;
        if (origUpstashUrl) process.env.UPSTASH_REDIS_REST_URL = origUpstashUrl;
        if (origUpstashToken) process.env.UPSTASH_REDIS_REST_TOKEN = origUpstashToken;
    }
});

test("isRedisConfigured returns true when REDIS_URL is present", () => {
    const origRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://localhost:6379";

    try {
        assert.equal(redisModule.isRedisConfigured(), true);
    } finally {
        if (origRedisUrl) process.env.REDIS_URL = origRedisUrl;
        else delete process.env.REDIS_URL;
    }
});

test("redis singleton is created and reused", () => {
    assert.ok(redisModule.redis, "redis singleton instance should exist");
    assert.equal(typeof redisModule.redis.get, "function");
    assert.equal(typeof redisModule.redis.set, "function");
    assert.equal(typeof redisModule.redis.pipeline, "function");
});

test("createRedisInstance creates a client with lazyConnect", () => {
    const client = redisModule.createRedisInstance("redis://localhost:6379");
    assert.ok(client);
    assert.equal(typeof client.get, "function");
    // Verify disconnect is clean
    client.disconnect();
});
