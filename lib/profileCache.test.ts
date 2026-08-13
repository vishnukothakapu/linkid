import assert from "node:assert/strict";
import { mock, test, before, after } from "node:test";

// ── In-memory fake of the @upstash/redis client ───────────────────────────────

const store = new Map<string, unknown>();
const setCalls: Array<{ key: string; value: unknown; opts?: unknown }> = [];
const delCalls: string[][] = [];
const getCalls: string[] = [];

class FakeRedis {
    get(key: string) {
        getCalls.push(key);
        return Promise.resolve(store.get(key) ?? null);
    }

    set(key: string, value: unknown, opts?: unknown) {
        setCalls.push({ key, value, opts });
        store.set(key, value);
        return Promise.resolve("OK");
    }

    del(...keys: string[]) {
        delCalls.push(keys);
        for (const key of keys) {
            store.delete(key);
        }
        return Promise.resolve(keys.length);
    }

    pipeline() {
        const commands: Array<{ fn: string; args: unknown[] }> = [];
        const pipeline = {
            set: (...args: unknown[]) => {
                commands.push({ fn: "set", args });
                return pipeline;
            },
            del: (...args: unknown[]) => {
                commands.push({ fn: "del", args });
                return pipeline;
            },
            incr: (...args: unknown[]) => {
                commands.push({ fn: "incr", args });
                return pipeline;
            },
            expire: (...args: unknown[]) => {
                commands.push({ fn: "expire", args });
                return pipeline;
            },
            exec: () => {
                const results = commands.map(({ fn, args }) => {
                    if (fn === "set") {
                        const [key, value, opts] = args as [string, unknown, unknown?];
                        setCalls.push({ key, value, opts });
                        store.set(key, value);
                        return "OK";
                    }
                    if (fn === "del") {
                        delCalls.push(args as string[]);
                        for (const key of args as string[]) {
                            store.delete(key);
                        }
                        return 1;
                    }
                    if (fn === "incr") {
                        const [key] = args as [string];
                        const next = (Number(store.get(key)) || 0) + 1;
                        store.set(key, next);
                        return next;
                    }
                    if (fn === "expire") {
                        return 1;
                    }
                    return null;
                });
                return Promise.resolve(results);
            },
        };
        return pipeline;
    }
}

const realUrl = process.env.UPSTASH_REDIS_REST_URL;
const realToken = process.env.UPSTASH_REDIS_REST_TOKEN;

mock.module("@upstash/redis", {
    namedExports: { Redis: FakeRedis },
});

// Dynamic import after mock registration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let profileCache: any;

before(async () => {
    profileCache = await import("@/lib/profileCache");
});

after(() => {
    if (realUrl) process.env.UPSTASH_REDIS_REST_URL = realUrl;
    if (realToken) process.env.UPSTASH_REDIS_REST_TOKEN = realToken;
    else {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
});

function withRedisConfigured() {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
}

function withoutRedis() {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("calls are no-ops and safe when Redis is not configured", async () => {
    withoutRedis();

    const cached = await profileCache.getCachedResolvedProfile("johndoe");
    assert.equal(cached, null);

    await profileCache.cacheResolvedProfile("johndoe", "user-1", { name: "John" });
    await profileCache.invalidateProfileCache("user-1");

    assert.equal(getCalls.length, 0, "no Redis client should be touched");
    assert.equal(setCalls.length, 0);
    assert.equal(delCalls.length, 0);
});

test("isRedisConfigured reflects the environment", () => {
    withoutRedis();
    assert.equal(profileCache.isRedisConfigured(), false);

    withRedisConfigured();
    assert.equal(profileCache.isRedisConfigured(), true);
});

test("cacheResolvedProfile writes a lowercased username index and the payload with TTLs", async () => {
    withRedisConfigured();
    store.clear();
    setCalls.length = 0;

    await profileCache.cacheResolvedProfile("JohnDoe", "user-1", {
        user: { id: "user-1", name: "John" },
        canonicalUsername: "johndoe",
    });

    assert.equal(setCalls.length, 2);
    assert.deepEqual(setCalls.map((c) => c.key), [
        "profile:username:johndoe",
        "profile:user-1",
    ]);
    assert.deepEqual(setCalls[0].opts, { ex: 60 * 60 * 24 });
    assert.deepEqual(setCalls[1].opts, { ex: 300 });
});

test("getCachedResolvedProfile serves a previously cached payload (cache hit)", async () => {
    withRedisConfigured();
    store.clear();
    getCalls.length = 0;

    const payload = { user: { id: "user-1", name: "John" }, canonicalUsername: "johndoe" };
    await profileCache.cacheResolvedProfile("johndoe", "user-1", payload);

    const cached = await profileCache.getCachedResolvedProfile("JohnDoe");
    assert.deepEqual(cached, payload);

    // Index lookup (miss-guard) then payload lookup.
    assert.deepEqual(getCalls, ["profile:username:johndoe", "profile:user-1"]);
});

test("getCachedResolvedProfile returns null for an unknown username", async () => {
    withRedisConfigured();
    store.clear();

    const cached = await profileCache.getCachedResolvedProfile("nobody");
    assert.equal(cached, null);
});

test("getCachedResolvedProfile returns null when the payload was invalidated", async () => {
    withRedisConfigured();
    store.clear();

    await profileCache.cacheResolvedProfile("johndoe", "user-1", {
        user: { id: "user-1", name: "John" },
        canonicalUsername: "johndoe",
    });

    await profileCache.invalidateProfileCache("user-1");
    assert.deepEqual(delCalls, [["profile:user-1"]]);

    const cached = await profileCache.getCachedResolvedProfile("johndoe");
    assert.equal(cached, null);
});

test("invalidation targets the payload key, not the (immutable) username index", async () => {
    withRedisConfigured();
    store.clear();

    await profileCache.cacheResolvedProfile("johndoe", "user-1", {
        user: { id: "user-1", name: "John" },
        canonicalUsername: "johndoe",
    });
    await profileCache.invalidateProfileCache("user-1");

    // The index survives invalidation but points at a missing payload, so the
    // next read is a miss (DB fallback) rather than a wrong cache hit.
    assert.equal(store.get("profile:username:johndoe"), "user-1");
    assert.equal(store.has("profile:user-1"), false);
});

test("cacheResolvedProfile skips the write when the generation changed since capture", async () => {
    withRedisConfigured();
    store.clear();
    setCalls.length = 0;

    // Simulate the race: read the generation, then an invalidation bumps it
    // before the write lands — the stale payload must not be repopulated.
    await profileCache.invalidateProfileCache("user-1");
    const captured = await profileCache.getProfileGeneration("user-1");
    assert.equal(captured, 1);
    await profileCache.invalidateProfileCache("user-1");

    await profileCache.cacheResolvedProfile(
        "johndoe",
        "user-1",
        { user: { id: "user-1", name: "John" } },
        captured
    );

    assert.equal(setCalls.length, 0, "stale payload must not be written back");
    assert.equal(store.has("profile:user-1"), false);
    assert.equal(store.has("profile:username:johndoe"), false);
});

test("cacheResolvedProfile writes when the captured generation still matches", async () => {
    withRedisConfigured();
    store.clear();
    setCalls.length = 0;

    await profileCache.invalidateProfileCache("user-1");
    const generation = await profileCache.getProfileGeneration("user-1");
    assert.equal(generation, 1);

    await profileCache.cacheResolvedProfile(
        "johndoe",
        "user-1",
        { user: { id: "user-1", name: "John" } },
        generation
    );

    assert.equal(setCalls.length, 2);
    const payload = store.get("profile:user-1") as { user: { id: string } };
    assert.equal(payload.user.id, "user-1");
});

test("invalidateProfileUsername clears the username index entry", async () => {
    withRedisConfigured();
    store.clear();

    await profileCache.cacheResolvedProfile("johndoe", "user-1", {
        user: { id: "user-1", name: "John" },
        canonicalUsername: "johndoe",
    });
    await profileCache.invalidateProfileUsername("JohnDoe");

    assert.equal(store.has("profile:username:johndoe"), false);
    assert.equal(await profileCache.getCachedResolvedProfile("johndoe"), null);
});
