/**
 * Fixed-window in-memory rate limiter.
 *
 * This is the fallback used by the middleware when Upstash Redis is not
 * configured (local development, single-container deploys, Redis outage).
 * It stores one counter per key per minute bucket.
 *
 * Buckets are single-use: once the minute moves on, the key can never be hit
 * again, so a sweep drops every bucket that is not the current one. Without
 * that sweep the map grows for the lifetime of the process (one entry per
 * client IP per minute), which is an unbounded leak and a trivial way to force
 * OOM by rotating `x-forwarded-for` values.
 */

type Bucket = {
    count: number;
};

const WINDOW_MS = 60_000;

const buckets = new Map<string, Bucket>();

// Sweep cadence: every N requests, and immediately when the map is large. The
// exact numbers only affect how much a sweep can reclaim at once.
const SWEEP_INTERVAL = 500;
const SWEEP_THRESHOLD = 5_000;

let requestsSinceSweep = 0;

function sweepExpiredBuckets(currentBucket: number): void {
    for (const key of buckets.keys()) {
        // Keys end in "-<minuteBucket>"; the separator is the last dash so IP
        // or prefix content (which may contain dashes) does not confuse it.
        const separator = key.lastIndexOf("-");
        const bucket = Number(key.slice(separator + 1));
        if (!Number.isFinite(bucket) || bucket !== currentBucket) {
            buckets.delete(key);
        }
    }
}

/**
 * Check (and record) one request for a fixed-window bucket.
 *
 * @param key   Unique bucket name (for example `"auth-1.2.3.4"`).
 * @param limit Maximum requests allowed per minute for this key.
 * @param now   Timestamp in ms. Only overridden by tests.
 * @returns `true` when the request is allowed, `false` when the limit is hit.
 */
export function checkLocalRateLimit(
    key: string,
    limit: number,
    now: number = Date.now()
): boolean {
    const currentBucket = Math.floor(now / WINDOW_MS);

    requestsSinceSweep++;
    if (requestsSinceSweep >= SWEEP_INTERVAL || buckets.size >= SWEEP_THRESHOLD) {
        requestsSinceSweep = 0;
        sweepExpiredBuckets(currentBucket);
    }

    const bucketKey = `${key}-${currentBucket}`;
    const current = buckets.get(bucketKey)?.count ?? 0;

    if (current >= limit) {
        return false;
    }

    buckets.set(bucketKey, { count: current + 1 });
    return true;
}

/**
 * Number of live buckets. Exposed for tests and diagnostics; callers should
 * not rely on it for rate limiting decisions.
 */
export function localRateLimitStoreSize(): number {
    return buckets.size;
}
