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
 *
 * ## Middleware helper
 * For convenience, `rateLimit(limit, windowMs)` returns a middleware function that
 * extracts the client IP from `x-forwarded-for` and handles the Next.js response.
 * Use it in API routes or middleware:
 *
 * ```ts
 * const rateLimitMiddleware = rateLimit(10, 60_000);
 * const response = await rateLimitMiddleware(req);
 * if (response) return response; // rate limited
 * // ... proceed with your route logic
 * ```
 */

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

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
 * Lua script that performs the whole sliding-window check as ONE atomic step.
 *
 * Redis executes a script without interleaving any other command, so the
 * "trim → count → compare → record" sequence cannot be raced by concurrent
 * requests (possibly arriving from different serverless instances).
 *
 * Previously the count and the ZADD were sent as two separate pipelines. An
 * Upstash pipeline is only a batching optimisation (it is NOT MULTI/EXEC), so
 * N concurrent requests could all read `count < limit` before any of them had
 * recorded itself and every one of them was allowed through. That let an
 * attacker fire a burst of parallel requests and bypass limits such as the
 * 5-attempts-per-15-minutes 2FA login limit.
 *
 * KEYS[1] = rate-limit key
 * ARGV[1] = now (ms)   ARGV[2] = window (ms)   ARGV[3] = limit   ARGV[4] = unique member
 *
 * Returns 1 when the request is allowed (and recorded), 0 when it is blocked.
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)

if redis.call('ZCARD', key) >= limit then
  return 0
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs)
return 1
`;

/**
 * Checks and records a request in Redis using a sorted-set sliding window.
 * The entire check-and-record operation runs atomically inside Redis via
 * {@link SLIDING_WINDOW_LUA}.
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
    // Unique member so several requests in the same millisecond are all stored.
    const member = `${now}-${randomUUID()}`;

    const allowed = await redis.eval(
        SLIDING_WINDOW_LUA,
        [`ratelimit:${key}`],
        [now, windowMs, limit, member],
    );

    return Number(allowed) === 1;
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

/**
 * Middleware-style rate limiter for Next.js API routes.
 *
 * Extracts the client IP from `x-forwarded-for` (or falls back to `"unknown"`)
 * and uses the shared `checkRateLimit` logic to enforce a sliding window.
 *
 * Returns a `NextResponse` with a 429 status if the limit is exceeded, otherwise `null`.
 * When a response is returned, it includes:
 * - `Retry-After` (seconds until the window resets, estimated)
 * - `X-RateLimit-Limit` (the configured limit)
 * - `X-RateLimit-Remaining` (always `"0"` when blocked)
 *
 * @param limit    Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(limit: number, windowMs: number) {
    return async function (req: NextRequest): Promise<NextResponse | null> {
        // Extract client IP
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

        const allowed = await checkRateLimit(ip, limit, windowMs);

        if (!allowed) {
            // Approximate time until the window expires; we don't have the exact reset time
            // for sliding windows, so we use the window duration as a safe estimate.
            const retryAfter = Math.ceil(windowMs / 1000);

            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(retryAfter),
                        "X-RateLimit-Limit": String(limit),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        // Request allowed – proceed
        return null;
    };
}