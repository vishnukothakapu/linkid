import assert from "node:assert/strict";
import test, { mock } from "node:test";

/**
 * Minimal fake of the parts of @upstash/redis used by rateLimit.ts.
 * Every network round-trip yields to the event loop (setImmediate) so that
 * concurrent requests interleave exactly as they would against real Redis.
 */
const sortedSets = new Map<string, Array<{ score: number; member: string }>>();
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

function applyCommand(cmd: [string, ...unknown[]]) {
    const [name, key, ...args] = cmd as [string, string, ...unknown[]];
    const set = sortedSets.get(key) ?? [];
    switch (name) {
        case "zremrangebyscore": {
            const [min, max] = args as [number, number];
            sortedSets.set(key, set.filter((e) => e.score < min || e.score > max));
            return 0;
        }
        case "zcard":
            return set.length;
        case "zadd": {
            const { score, member } = args[0] as { score: number; member: string };
            sortedSets.set(key, [...set, { score, member }]);
            return 1;
        }
        default:
            return 1; // expire / pexpire
    }
}

class FakeRedis {
    pipeline() {
        const queued: Array<[string, ...unknown[]]> = [];
        const p = {
            zremrangebyscore: (...a: unknown[]) => (queued.push(["zremrangebyscore", ...a]), p),
            zcard: (...a: unknown[]) => (queued.push(["zcard", ...a]), p),
            zadd: (...a: unknown[]) => (queued.push(["zadd", ...a]), p),
            expire: (...a: unknown[]) => (queued.push(["expire", ...a]), p),
            exec: async () => {
                await tick(); // network round-trip
                return queued.map(applyCommand);
            },
        };
        return p;
    }

    // Redis executes a Lua script as one uninterruptible unit.
    async eval(_script: string, keys: string[], args: unknown[]) {
        await tick();
        const [now, windowMs, limit, member] = args as [number, number, number, string];
        applyCommand(["zremrangebyscore", keys[0], 0, now - windowMs]);
        if (applyCommand(["zcard", keys[0]]) >= limit) return 0;
        applyCommand(["zadd", keys[0], { score: now, member }]);
        return 1;
    }
}

mock.module("@upstash/redis", { namedExports: { Redis: FakeRedis } });

test("Redis backend: concurrent requests cannot exceed the limit (check-then-add race)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    sortedSets.clear();

    const { checkRateLimit } = await import("@/lib/rateLimit");

    const LIMIT = 5;
    const results = await Promise.all(
        Array.from({ length: 50 }, () => checkRateLimit("2fa-login:user-1", LIMIT, 60_000))
    );

    const allowed = results.filter(Boolean).length;
    assert.equal(allowed, LIMIT, `expected exactly ${LIMIT} allowed, got ${allowed}`);
});
