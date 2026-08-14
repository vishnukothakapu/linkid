import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

// 5 login attempts per 15 minutes (Token Bucket)
export const authRateLimit = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.tokenBucket(5, "15 m", 5),
          analytics: true,
          prefix: "@upstash/ratelimit/auth",
      })
    : null;

// 30 API calls per minute (Token Bucket)
export const linksRateLimit = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.tokenBucket(30, "1 m", 30),
          analytics: true,
          prefix: "@upstash/ratelimit/links",
      })
    : null;

// 15 API calls per minute (Token Bucket)
export const usernameRateLimit = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.tokenBucket(15, "1 m", 15),
          analytics: true,
          prefix: "@upstash/ratelimit/username",
      })
    : null;

// In-memory fallback
const localFallbackMap = new Map<string, number>();
export function checkLocalRateLimit(ip: string, limit: number): boolean {
    const key = `${ip}-${Math.floor(Date.now() / 60000)}`;
    const current = localFallbackMap.get(key) || 0;
    if (current >= limit) return false;
    localFallbackMap.set(key, current + 1);
    return true;
}
