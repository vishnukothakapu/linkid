import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  ts: number;
}

// In-process store — works for single-instance deployments.
// For multi-instance Vercel Edge, swap to @upstash/ratelimit (see .env.example).
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.ts > 5 * 60_000) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

/**
 * Returns a 429 NextResponse if the caller exceeds the limit, otherwise null.
 * @param req      The incoming NextRequest
 * @param key      Unique key (e.g. `username:${ip}` or `links:${userId}`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.ts > windowMs) {
    rateLimitMap.set(key, { count: 1, ts: now });
    return null; // allowed
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(windowMs / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  record.count++;
  return null; // allowed
}

/** Extracts the best available IP from the request headers */
export function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}