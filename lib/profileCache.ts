/**
 * Distributed Redis-backed cache for public profile payloads.
 *
 * Supports standard Redis (via ioredis singleton in lib/redis.ts) with
 * payload compression (gzip) and automatic fallback to Upstash Redis REST
 * when only Upstash credentials are present.
 *
 * The public profile tree (/u/[username] and /[username]) is the hottest read
 * path in the app. Resolved payloads are compressed and cached in Redis with a TTL.
 *
 * Mutating routes in api/links and api/profile implement a write-through cache strategy:
 * whenever a user edits their links or profile, the cache is eagerly purged and
 * repopulated with the fresh compressed payload from PostgreSQL.
 */

import zlib from "node:zlib";

type UpstashRedis = import("@upstash/redis").Redis;
type IoRedis = import("ioredis").default;

// Payload TTL: how long a resolved profile can be served from Redis before
// the next visit re-reads from PostgreSQL.
export const PROFILE_CACHE_TTL_SECONDS = process.env.PROFILE_CACHE_TTL
    ? parseInt(process.env.PROFILE_CACHE_TTL, 10)
    : 300; // 5 minutes default

// Username→userId index TTL: long-lived because username→owner mappings are
// immutable, but bounded so freed usernames (account deletion) self-heal.
export const USERNAME_INDEX_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export const PROFILE_PAYLOAD_PREFIX = "profile:";
export const USERNAME_INDEX_PREFIX = "profile:username:";
export const PROFILE_GENERATION_PREFIX = "profile:gen:";

// How long a bumped generation key lives. Must comfortably exceed the payload
// TTL so a captured generation can never outlive the payload it guards.
export const PROFILE_GENERATION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

let upstashClient: UpstashRedis | null = null;
let profileRepopulator: ((id: string) => Promise<void>) | null = null;

/**
 * Returns true if Redis configuration (standard REDIS_URL or Upstash REST)
 * is present in the environment.
 */
export function isRedisConfigured(): boolean {
    return Boolean(
        process.env.REDIS_URL ||
        (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    );
}

/**
 * Register a repopulator function (typically from lib/userLookup.ts) so that
 * cache invalidation hooks can eagerly refresh cache entries without circular dependencies.
 */
export function registerProfileRepopulator(fn: (id: string) => Promise<void>) {
    profileRepopulator = fn;
}

/**
 * Compresses an arbitrary JSON-serializable payload into a gzip Buffer.
 */
export function compressPayload<T>(payload: T): Buffer {
    const jsonStr = JSON.stringify(payload);
    return zlib.gzipSync(Buffer.from(jsonStr, "utf-8"));
}

/**
 * Decompresses a Buffer or string from Redis back into the typed payload.
 * Handles:
 * - Gzipped Buffer or base64/hex string (starts with 0x1f, 0x8b)
 * - Raw uncompressed JSON string or Buffer (for backward compatibility)
 */
export function decompressPayload<T>(data: unknown): T {
    if (!data) {
        throw new Error("Empty data to decompress");
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
        buffer = data;
    } else if (typeof data === "string") {
        const trimmed = data.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return JSON.parse(data) as T;
        }
        buffer = Buffer.from(data, "base64");
    } else if (typeof data === "object") {
        return data as T;
    } else {
        throw new Error(`Unexpected data type: ${typeof data}`);
    }

    // Check gzip magic header (0x1f, 0x8b)
    if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
        const decompressed = zlib.gunzipSync(buffer);
        return JSON.parse(decompressed.toString("utf-8")) as T;
    }

    // Fall back to plain utf-8 JSON parsing
    return JSON.parse(buffer.toString("utf-8")) as T;
}

/**
 * Lazily gets the Redis client.
 * Prioritizes ioredis when REDIS_URL is present, otherwise falls back to @upstash/redis.
 */
async function getRedisClient(): Promise<{ type: "ioredis"; client: IoRedis } | { type: "upstash"; client: UpstashRedis } | null> {
    if (!isRedisConfigured()) {
        return null;
    }

    if (process.env.REDIS_URL) {
        try {
            const { redis } = await import("./redis");
            return { type: "ioredis", client: redis };
        } catch (error) {
            console.error("[profileCache] ioredis client load failed:", error);
            return null;
        }
    }

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        if (upstashClient) {
            return { type: "upstash", client: upstashClient };
        }
        try {
            const { Redis } = await import("@upstash/redis");
            upstashClient = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            return { type: "upstash", client: upstashClient };
        } catch (error) {
            console.error("[profileCache] Upstash client init failed:", error);
            return null;
        }
    }

    return null;
}

export function profilePayloadKey(userId: string): string {
    return `${PROFILE_PAYLOAD_PREFIX}${userId}`;
}

export function usernameIndexKey(username: string): string {
    return `${USERNAME_INDEX_PREFIX}${username.toLowerCase()}`;
}

export function profileGenerationKey(userId: string): string {
    return `${PROFILE_GENERATION_PREFIX}${userId}`;
}

/**
 * Read the current cache generation for a user, or `null` when it has never
 * been invalidated (no generation key) or Redis is unavailable.
 */
export async function getProfileGeneration(
    userId: string
): Promise<number | null> {
    const handle = await getRedisClient();
    if (!handle) {
        return null;
    }

    try {
        const key = profileGenerationKey(userId);
        let raw: string | null = null;
        if (handle.type === "ioredis") {
            raw = await handle.client.get(key);
        } else {
            raw = await handle.client.get<string>(key);
        }

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
 * Read a cached username index entry (owner id) plus its decompressed payload.
 * Returns `{ userId, payload }`. Both are `null` on a miss or error.
 */
export async function readCachedResolvedProfile<T>(
    username: string
): Promise<{ userId: string | null; payload: T | null }> {
    const handle = await getRedisClient();
    if (!handle) {
        return { userId: null, payload: null };
    }

    try {
        const indexKey = usernameIndexKey(username);
        let userId: string | null = null;

        if (handle.type === "ioredis") {
            userId = await handle.client.get(indexKey);
        } else {
            userId = await handle.client.get<string>(indexKey);
        }

        if (!userId) {
            return { userId: null, payload: null };
        }

        const payloadKey = profilePayloadKey(userId);
        if (handle.type === "ioredis") {
            const rawBuffer = await handle.client.getBuffer(payloadKey);
            if (!rawBuffer) {
                return { userId, payload: null };
            }
            const payload = decompressPayload<T>(rawBuffer);
            return { userId, payload };
        } else {
            const raw = await handle.client.get<unknown>(payloadKey);
            if (!raw) {
                return { userId, payload: null };
            }
            const payload = decompressPayload<T>(raw);
            return { userId, payload };
        }
    } catch (error) {
        console.error("[profileCache] cache read failed:", error);
        return { userId: null, payload: null };
    }
}

/**
 * Read a cached public profile for a requested username (canonical or alias).
 * Returns `null` on a cache miss, when Redis is unavailable, or when lookup fails.
 */
export async function getCachedResolvedProfile<T>(
    username: string
): Promise<T | null> {
    const { payload } = await readCachedResolvedProfile<T>(username);
    return payload;
}

/**
 * Store a resolved public profile in Redis. Compresses the payload with gzip,
 * writes both the username index and the compressed payload with TTLs.
 *
 * `capturedGeneration` guards against stale overwrites if an invalidation
 * occurred concurrently while fetching from the database.
 */
export async function cacheResolvedProfile<T>(
    username: string,
    userId: string,
    payload: T,
    capturedGeneration?: number | null,
    aliases?: string[]
): Promise<void> {
    const handle = await getRedisClient();
    if (!handle) {
        return;
    }

    try {
        if (capturedGeneration != null) {
            const currentGeneration = await getProfileGeneration(userId);
            if (currentGeneration !== capturedGeneration) {
                // Stale-write guard: cache was invalidated while fetching from DB.
                return;
            }
        }

        const compressed = compressPayload(payload);

        if (handle.type === "ioredis") {
            const pipeline = handle.client.pipeline();
            pipeline.set(usernameIndexKey(username), userId, "EX", USERNAME_INDEX_TTL_SECONDS);
            if (aliases && aliases.length > 0) {
                for (const alias of aliases) {
                    pipeline.set(usernameIndexKey(alias), userId, "EX", USERNAME_INDEX_TTL_SECONDS);
                }
            }
            pipeline.set(profilePayloadKey(userId), compressed, "EX", PROFILE_CACHE_TTL_SECONDS);
            await pipeline.exec();
        } else {
            const pipeline = handle.client.pipeline();
            pipeline.set(usernameIndexKey(username), userId, {
                ex: USERNAME_INDEX_TTL_SECONDS,
            });
            if (aliases && aliases.length > 0) {
                for (const alias of aliases) {
                    pipeline.set(usernameIndexKey(alias), userId, {
                        ex: USERNAME_INDEX_TTL_SECONDS,
                    });
                }
            }
            pipeline.set(profilePayloadKey(userId), compressed.toString("base64"), {
                ex: PROFILE_CACHE_TTL_SECONDS,
            });
            await pipeline.exec();
        }
    } catch (error) {
        console.error("[profileCache] cache write failed:", error);
    }
}

/**
 * Delete a user's cached public profile and bump generation counter atomically.
 * Optionally triggers eager repopulation (write-through cache strategy).
 */
export async function invalidateProfileCache(
    userId: string,
    options?: { repopulate?: boolean; writeThrough?: boolean }
): Promise<void> {
    const handle = await getRedisClient();
    if (handle) {
        try {
            if (handle.type === "ioredis") {
                const pipeline = handle.client.pipeline();
                pipeline.incr(profileGenerationKey(userId));
                pipeline.expire(profileGenerationKey(userId), PROFILE_GENERATION_TTL_SECONDS);
                pipeline.del(profilePayloadKey(userId));
                await pipeline.exec();
            } else {
                const pipeline = handle.client.pipeline();
                pipeline.incr(profileGenerationKey(userId));
                pipeline.expire(profileGenerationKey(userId), PROFILE_GENERATION_TTL_SECONDS);
                pipeline.del(profilePayloadKey(userId));
                await pipeline.exec();
            }
        } catch (error) {
            console.error("[profileCache] cache invalidation failed:", error);
        }
    }

    if (options?.repopulate || options?.writeThrough) {
        await repopulateProfileCache(userId);
    }
}

/**
 * Repopulates the cache for a given workspace/user directly from PostgreSQL.
 * If a repopulator has been registered (via registerProfileRepopulator), it runs now.
 */
export async function repopulateProfileCache(
    workspaceIdOrUserId: string
): Promise<void> {
    if (profileRepopulator) {
        try {
            await profileRepopulator(workspaceIdOrUserId);
        } catch (error) {
            console.error("[profileCache] repopulation error:", error);
        }
    }
}

/**
 * Write-through cache strategy hook:
 * Eagerly purges the existing Redis cache entry and repopulates it
 * with the fresh compressed payload from PostgreSQL.
 */
export async function writeThroughProfileCache(
    workspaceIdOrUserId: string
): Promise<void> {
    await invalidateProfileCache(workspaceIdOrUserId);
    await repopulateProfileCache(workspaceIdOrUserId);
}

/**
 * Delete a username→userId index entry. Used when username ownership changes
 * so the index never points at a different owner's payload.
 */
export async function invalidateProfileUsername(
    username: string
): Promise<void> {
    const handle = await getRedisClient();
    if (!handle) {
        return;
    }

    try {
        if (handle.type === "ioredis") {
            await handle.client.del(usernameIndexKey(username));
        } else {
            await handle.client.del(usernameIndexKey(username));
        }
    } catch (error) {
        console.error("[profileCache] username index invalidation failed:", error);
    }
}
