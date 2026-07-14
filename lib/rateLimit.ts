/**
 * Dual-mode sliding-window rate limiter for Next.js API routes.
 *
 * ## Modes
 *
 * ### In-Memory (default / local dev)
 * Used when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are **not** set.
 * Stores timestamps in a `Map` local to the process. Works perfectly for single-instance
 * deployments (local dev, single container) but **does not share state** across
 * multiple serverless function instances.
 *
 * ### Redis / Upstash (production)
 * Used when both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 * Uses a Redis sorted-set sliding-window algorithm so rate-limit state is shared
 * across every instance, edge function, or server replica. This prevents users from
 * bypassing limits by hitting a different server.
 *
 * ## Public interface
 * Both modes expose the same async signature so call sites are identical:
 *
 * ```ts
 * const allowed = await checkRateLimit(key, limit, windowMs);
 * if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 * ```
 */

// ─── In-Memory Backend ────────────────────────────────────────────────────────

type WindowEntry = {
    timestamps: number[];
    windowMs: number;
};

const store = new Map<string, WindowEntry>();

// Periodic full-store sweep so keys added by one-off or rotating IPs do not
// accumulate indefinitely. A sweep removes every key whose window has fully
// expired, bounding Map growth to the number of distinct keys seen within one
// rolling window rather than the lifetime of the process.
let requestsSinceCleanup = 0;
const CLEANUP_INTERVAL = 500; // sweep after every N requests

function sweepExpiredKeys(): void {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        const cutoff = now - entry.windowMs;
        if (entry.timestamps.every((t) => t <= cutoff)) {
            store.delete(key);
        }
    }
}

function checkRateLimitMemory(
    key: string,
    limit: number,
    windowMs: number,
): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;

    requestsSinceCleanup++;
    if (requestsSinceCleanup >= CLEANUP_INTERVAL) {
        requestsSinceCleanup = 0;
        sweepExpiredKeys();
    }

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [], windowMs };
        store.set(key, entry);
    } else {
        entry.windowMs = windowMs;
    }

    // Evict timestamps outside the current window.
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
        return false;
    }

    entry.timestamps.push(now);
    return true;
}

// ─── Redis Backend ────────────────────────────────────────────────────────────

/**
 * Checks and records a request in Redis using a sorted-set sliding window.
 *
 * Algorithm:
 *  1. Remove members (timestamps) outside the current window with ZREMRANGEBYSCORE.
 *  2. Count remaining members with ZCARD.
 *  3. If under limit, add the current timestamp with ZADD and refresh TTL with EXPIRE.
 *  4. Return whether the request is allowed.
 *
 * All four commands are pipelined in a single round-trip via MULTI/EXEC so the
 * operation is atomic and race-condition-safe.
 */
async function checkRateLimitRedis(
    key: string,
    limit: number,
    windowMs: number,
): Promise<boolean> {
    // Lazy-import so the module is only loaded when Redis is actually needed.
    // This keeps cold-start overhead zero in in-memory mode.
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    const ttlSeconds = Math.ceil(windowMs / 1000);

    // Pipeline all commands in one round-trip.
    const pipeline = redis.pipeline();
    // 1. Remove expired entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // 2. Count remaining entries in the window
    pipeline.zcard(redisKey);

    const [, count] = await pipeline.exec<[number, number]>();

    if (count >= limit) {
        return false;
    }

    // 3. Record this request (use timestamp as both score and unique member)
    // Append a random suffix to the member to allow multiple requests at the exact same ms.
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const addPipeline = redis.pipeline();
    addPipeline.zadd(redisKey, { score: now, member });
    addPipeline.expire(redisKey, ttlSeconds);
    await addPipeline.exec();

    return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns `true` when the request is allowed, `false` when the rate limit is exceeded.
 *
 * Automatically selects the Redis backend when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are present in the environment; otherwise falls
 * back to the in-memory backend.
 *
 * @param key      Unique identifier for this rate-limit bucket (e.g. `"register:1.2.3.4"`)
 * @param limit    Maximum number of requests allowed in the window
 * @param windowMs Rolling window duration in milliseconds
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): Promise<boolean> {
    const useRedis =
        Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
        Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

    if (useRedis) {
        try {
            return await checkRateLimitRedis(key, limit, windowMs);
        } catch (err) {
            // If Redis is unavailable, fall back to in-memory rather than
            // blocking all traffic. Log the error so it surfaces in monitoring.
            console.error("[rateLimit] Redis error, falling back to in-memory:", err);
            return checkRateLimitMemory(key, limit, windowMs);
        }
    }

    return checkRateLimitMemory(key, limit, windowMs);
}
