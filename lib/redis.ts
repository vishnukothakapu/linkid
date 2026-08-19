let redisClient: import('@upstash/redis').Redis | null = null;

export function isRedisConfigured(): boolean {
  return (
      Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

export async function getRedisClient(): Promise<import('@upstash/redis').Redis | null> {
  if (!isRedisConfigured()) {
      return null;
  }

  if (redisClient) {
      return redisClient;
  }

  try {
      const { Redis } = await import("@upstash/redis");
      redisClient = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
  } catch (error) {
      console.error("[redis] Redis client init failed:", error);
      redisClient = null;
  }
  return redisClient;
}
