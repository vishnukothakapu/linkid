/**
 * Redis-backed edge cache for public profile payloads.
 *
 * The public `/u` profile tree is the hottest read path in the app. The resolved
 * payload is cached in Upstash Redis so repeat visitors are served from the edge
 * instead of hitting PostgreSQL on every page load. Every dashboard mutation
 * deletes the owner's key via `invalidateProfileCache`, so edits appear on the
 * public profile immediately.
 *
 * When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set
 * (local dev, CI), every function becomes a safe no-op so the rest of the app
 * behaves exactly as before — no caching, straight to the database.
 *
 * ## Key layout
 * - `profile:<userId>`            — JSON payload of one user's public profile.
 *                                   Keyed by user id so a single DEL invalidates
 *                                   the canonical username and every alias at
 *                                   once.
 * - `profile:username:<username>` — maps a requested username (canonical or
 *                                   alias) to its owner's user id. Usernames are
 *                                   permanently reserved once claimed, so a
 *                                   stale entry can only point to a *missing*
 *                                   payload (which triggers a DB fallback) —
 *                                   it can never serve another user's data.
 */

type Redis = import("@upstash/redis").Redis;

// Payload TTL: how long a resolved profile can be served from Redis before the
// next visit re-reads it from PostgreSQL.
const PROFILE_CACHE_TTL_SECONDS = 300; // 5 minutes

// Username→userId index TTL: long-lived because username→owner mappings are
// immutable, but bounded so freed usernames (account deletion) self-heal.
const USERNAME_INDEX_TTL_SECONDS = 60 * 60 * 24; // 24 hours

const PROFILE_PAYLOAD_PREFIX = "profile:";
const USERNAME_INDEX_PREFIX = "profile:username:";

let redisClient: Redis | null = null;

export function isRedisConfigured(): boolean {
    return (
        Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
        Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)
    );
}

/**
 * Lazily constructs (and then reuses) the Upstash Redis client. Lazy-importing
 * `@upstash/redis` keeps cold-start overhead zero in in-memory/no-Redis mode.
 */
async function getRedis(): Promise<Redis | null> {
    if (!isRedisConfigured()) {
        return null;
    }

    if (redisClient) {
        return redisClient;
    }

    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return redisClient;
}

function profilePayloadKey(userId: string): string {
    return `${PROFILE_PAYLOAD_PREFIX}${userId}`;
}

function usernameIndexKey(username: string): string {
    return `${USERNAME_INDEX_PREFIX}${username.toLowerCase()}`;
}

/**
 * Read a cached public profile for a requested username (canonical or alias).
 * Returns `null` on a cache miss, when Redis is unavailable, or when the lookup
 * fails — every one of those falls through to the database.
 */
export async function getCachedResolvedProfile<T>(
    username: string
): Promise<T | null> {
    const redis = await getRedis();
    if (!redis) {
        return null;
    }

    try {
        const userId = await redis.get<string>(usernameIndexKey(username));
        if (!userId) {
            return null;
        }

        const payload = await redis.get<T>(profilePayloadKey(userId));
        return payload ?? null;
    } catch (error) {
        // A cache failure must never take the public profile down — fall
        // through to the database. The next write will retry on the next miss.
        console.error("[profileCache] cache read failed:", error);
        return null;
    }
}

/**
 * Store a resolved public profile in Redis. Writes both the username index and
 * the user-id payload so any alias/canonical username resolves in one round trip.
 */
export async function cacheResolvedProfile<T>(
    username: string,
    userId: string,
    payload: T
): Promise<void> {
    const redis = await getRedis();
    if (!redis) {
        return;
    }

    try {
        const pipeline = redis.pipeline();
        pipeline.set(usernameIndexKey(username), userId, {
            ex: USERNAME_INDEX_TTL_SECONDS,
        });
        pipeline.set(profilePayloadKey(userId), payload, {
            ex: PROFILE_CACHE_TTL_SECONDS,
        });
        await pipeline.exec();
    } catch (error) {
        // Never let a cache write failure break the page render.
        console.error("[profileCache] cache write failed:", error);
    }
}

/**
 * Delete a user's cached public profile so the next page load is served fresh.
 * Called by every dashboard mutation that changes public profile data.
 */
export async function invalidateProfileCache(userId: string): Promise<void> {
    const redis = await getRedis();
    if (!redis) {
        return;
    }

    try {
        await redis.del(profilePayloadKey(userId));
    } catch (error) {
        // Invalidation failures are bounded by the payload TTL.
        console.error("[profileCache] cache invalidation failed:", error);
    }
}
