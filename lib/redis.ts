import Redis, { type RedisOptions } from "ioredis";

declare global {
    // eslint-disable-next-line no-var
    var redisGlobal: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Returns true if Redis configuration (either standard REDIS_URL or Upstash REST)
 * is present in the environment.
 */
export function isRedisConfigured(): boolean {
    return Boolean(
        process.env.REDIS_URL ||
        (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    );
}

/**
 * Factory to create an ioredis instance with safe defaults:
 * - lazyConnect: does not immediately open socket until first command
 * - maxRetriesPerRequest: fails quickly on disconnection instead of hanging
 * - error listener: catches connection errors to prevent unhandled error crashes
 */
export function createRedisInstance(customUrl?: string, customOptions?: RedisOptions): Redis {
    const url = customUrl || REDIS_URL;
    const options: RedisOptions = {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            return Math.min(times * 50, 2000);
        },
        ...customOptions,
    };

    const client = new Redis(url, options);

    client.on("error", (err) => {
        // Prevent unhandled exception if Redis is unavailable or loses connection
        console.error("[Redis] Client error:", err?.message || err);
    });

    return client;
}

/**
 * Global singleton instance of the ioredis client.
 * In development, Next.js hot-reloading would otherwise recreate clients and leak sockets.
 */
export const redis: Redis = globalThis.redisGlobal ?? createRedisInstance();

if (process.env.NODE_ENV !== "production") {
    globalThis.redisGlobal = redis;
}

export default redis;
