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
const PROFILE_GENERATION_PREFIX = "profile:gen:";

// How long a bumped generation key lives. Must comfortably exceed the payload
// TTL so a captured generation can never outlive the payload it guards.
const PROFILE_GENERATION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

import { getRedisClient, isRedisConfigured } from './redis';

export { isRedisConfigured };

async function getRedis(): Promise<Redis | null> {
    return getRedisClient();
}

function profilePayloadKey(userId: string): string {
    return `${PROFILE_PAYLOAD_PREFIX}${userId}`;
}

function usernameIndexKey(username: string): string {
    return `${USERNAME_INDEX_PREFIX}${username.toLowerCase()}`;
}

function profileGenerationKey(userId: string): string {
    return `${PROFILE_GENERATION_PREFIX}${userId}`;
}

/**
 * Read the current cache generation for a user, or `null` when it has never
 * been invalidated (no generation key) or Redis is unavailable.
 */
export async function getProfileGeneration(
    userId: string
): Promise<number | null> {
    const redis = await getRedis();
    if (!redis) {
        return null;
    }

    try {
        const raw = await redis.get<string>(profileGenerationKey(userId));
        if (raw == null) {
            return null;
        }
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? null : parsed;
    } catch (error) {
        console.error("[profileCache] generation read failed:", error);
        return null;
    }
}

/**
 * Read a cached username index entry (owner id) plus its payload. Returns
 * `{ userId, payload }` so callers can pin the cache generation before a
 * database read. Both are `null` on a miss, when Redis is unavailable, or when
 * the lookup fails — every one of those falls through to the database.
 */
export async function readCachedResolvedProfile<T>(
    username: string
): Promise<{ userId: string | null; payload: T | null }> {
    const redis = await getRedis();
    if (!redis) {
        return { userId: null, payload: null };
    }

    try {
        const userId = await redis.get<string>(usernameIndexKey(username));
        if (!userId) {
            return { userId: null, payload: null };
        }

        const payload = await redis.get<T>(profilePayloadKey(userId));
        return { userId, payload: payload ?? null };
    } catch (error) {
        // A cache failure must never take the public profile down — fall
        // through to the database. The next write will retry on the next miss.
        console.error("[profileCache] cache read failed:", error);
        return { userId: null, payload: null };
    }
}

/**
 * Read a cached public profile for a requested username (canonical or alias).
 * Returns `null` on a cache miss, when Redis is unavailable, or when the lookup
 * fails — every one of those falls through to the database.
 */
export async function getCachedResolvedProfile<T>(
    username: string
): Promise<T | null> {
    const { payload } = await readCachedResolvedProfile<T>(username);
    return payload;
}

/**
 * Store a resolved public profile in Redis. Writes both the username index and
 * the user-id payload so any alias/canonical username resolves in one round trip.
 *
 * `capturedGeneration` is the value of `getProfileGeneration(userId)` read
 * *before* the caller's database query. When it no longer matches the current
 * generation an invalidation happened during the read, so the payload may be
 * stale — the write is skipped and the next request re-reads from PostgreSQL.
 */
export async function cacheResolvedProfile<T>(
    username: string,
    userId: string,
    payload: T,
    capturedGeneration?: number | null
): Promise<void> {
    const redis = await getRedis();
    if (!redis) {
        return;
    }

    try {
        if (capturedGeneration != null) {
            const currentGeneration = await getProfileGeneration(userId);
            if (currentGeneration !== capturedGeneration) {
                // Stale-write guard: the cache was invalidated while the
                // payload was being read from the database. Do not repopulate
                // it with pre-invalidation data.
                return;
            }
        }

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
 *
 * Also bumps the user's cache generation atomically (increment-then-delete) so
 * any in-flight cache write that read the payload before this invalidation sees
 * a mismatch and skips writing stale data back.
 */
export async function invalidateProfileCache(userId: string): Promise<void> {
    const redis = await getRedis();
    if (!redis) {
        return;
    }

    try {
        const pipeline = redis.pipeline();
        pipeline.incr(profileGenerationKey(userId));
        pipeline.expire(profileGenerationKey(userId), PROFILE_GENERATION_TTL_SECONDS);
        pipeline.del(profilePayloadKey(userId));
        await pipeline.exec();
    } catch (error) {
        // Invalidation failures are bounded by the payload TTL.
        console.error("[profileCache] cache invalidation failed:", error);
    }
}

/**
 * Delete a username→userId index entry. Used when username ownership changes
 * (merge, account deletion, username reclaim) so the index never points at a
 * different owner's payload or a freed username's stale id.
 */
export async function invalidateProfileUsername(
    username: string
): Promise<void> {
    const redis = await getRedis();
    if (!redis) {
        return;
    }

    try {
        await redis.del(usernameIndexKey(username));
    } catch (error) {
        console.error("[profileCache] username index invalidation failed:", error);
    }
}
