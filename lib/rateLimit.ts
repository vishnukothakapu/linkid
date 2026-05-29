/**
 * Lightweight in-memory sliding-window rate limiter for Next.js API routes.
 *
 * Each call to `checkRateLimit` records a timestamp for the given key and
 * returns whether the caller has exceeded the allowed request count within
 * the rolling window.
 *
 * Suitable for single-instance deployments (local dev, single-container).
 * For multi-instance production, swap the internal store for a shared Redis
 * backend (e.g. Upstash) while keeping the same public interface.
 */

type WindowEntry = {
    timestamps: number[];
};

const store = new Map<string, WindowEntry>();

/**
 * Check whether `key` has exceeded `limit` requests in the last
 * `windowMs` milliseconds.
 *
 * @returns `true` when the request is allowed, `false` when the limit is hit.
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Evict timestamps outside the current window.
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
        return false;
    }

    entry.timestamps.push(now);
    return true;
}
