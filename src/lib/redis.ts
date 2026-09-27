import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error('Missing Redis environment variables');
    }

    redisInstance = new Redis({
      url,
      token,
    });
  }

  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as any)[prop];
  }
});

// Cache key generators
export const cacheKeys = {
  enkaResponse: (uid: string) => `enka:uid:${uid}`,
  rateLimit: (ip: string) => `ratelimit:ip:${ip}`,
} as const;

// Cache Enka response with TTL
export async function cacheEnkaResponse(uid: string, data: any, ttl: number) {
  const key = cacheKeys.enkaResponse(uid);
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}

// Get cached Enka response
export async function getCachedEnkaResponse<T>(uid: string): Promise<T | null> {
  const key = cacheKeys.enkaResponse(uid);
  const cached = await redis.get(key);

  if (!cached) return null;

  return typeof cached === 'string' ? JSON.parse(cached) as T : cached as T;
}

// Get remaining TTL for cached response
export async function getCachedEnkaTTL(uid: string): Promise<number> {
  const key = cacheKeys.enkaResponse(uid);
  const ttl = await redis.ttl(key);
  return Math.max(0, ttl);
}

// Rate limiting: sliding window
export async function checkRateLimit(ip: string, limit: number = 10, windowSeconds: number = 60): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
}> {
  const key = cacheKeys.rateLimit(ip);

  const current = await redis.incr(key);

  // Set expiry on first request
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const allowed = current <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - current),
    resetIn: ttl > 0 ? ttl : windowSeconds,
  };
}

// Clear rate limit (for testing)
export async function clearRateLimit(ip: string) {
  const key = cacheKeys.rateLimit(ip);
  await redis.del(key);
}
