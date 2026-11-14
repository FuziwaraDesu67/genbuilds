import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;
let redisDisabled = false;
let redisCooldownUntil = 0;
let redisWarningLogged = false;

// In-memory fallback stores
interface CacheEntry {
  value: any;
  expiresAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const memoryRateLimit = new Map<string, RateLimitEntry>();
const lastKnownGoodMap = new Map<string, any>();

function tripRedisCooldown(reason: unknown) {
  redisCooldownUntil = Date.now() + 5 * 60_000;
  if (!redisWarningLogged) {
    console.warn('⚠️ Upstash Redis unreachable, using in-memory fallback for 5m:', (reason as Error)?.message || reason);
    redisWarningLogged = true;
  }
}

function getRedis(): Redis | null {
  if (redisDisabled || Date.now() < redisCooldownUntil) return null;
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      if (!redisWarningLogged) {
        console.warn('⚠️ Upstash Redis environment variables missing. Using in-memory cache/rate-limiting fallback.');
        redisWarningLogged = true;
      }
      redisDisabled = true;
      return null;
    }

    try {
      redisInstance = new Redis({
        url,
        token,
        retry: false,
      });
    } catch (err) {
      console.warn('⚠️ Failed to initialize Redis client. Using in-memory fallback:', err);
      redisDisabled = true;
      return null;
    }
  }

  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis();
    if (!client) {
      return () => Promise.resolve(null);
    }
    return (client as any)[prop];
  }
});

// Cache key generators
export const cacheKeys = {
  enkaResponse: (uid: string) => `enka:uid:${uid}`,
  akashaBenchmark: (calculationId: string) => `akasha:lb:${calculationId}`,
  akashaCategories: () => `akasha:v2:categories`,
  akashaLeaderboardEntries: (calculationId: string, page: number, size: number) =>
    `akasha:lb:entries:${calculationId}:p${page}:s${size}`,
  rateLimit: (ip: string) => `ratelimit:ip:${ip}`,
} as const;

/** Store any JSON-serializable payload in Redis or in-memory fallback. */
export async function setCachedJson(key: string, data: any, ttl: number) {
  lastKnownGoodMap.set(key, data);
  const client = getRedis();

  if (client) {
    try {
      await client.set(key, JSON.stringify(data), { ex: ttl });
      return;
    } catch (err) {
      tripRedisCooldown(err);
    }
  }

  memoryCache.set(key, {
    value: data,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/** Retrieve a JSON payload from Redis or in-memory fallback. */
export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = getRedis();

  if (client) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return typeof cached === 'string' ? (JSON.parse(cached) as T) : (cached as T);
      }
      return null;
    } catch (err) {
      tripRedisCooldown(err);
    }
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

// Cache Enka response with TTL
export async function cacheEnkaResponse(uid: string, data: any, ttl: number) {
  await setCachedJson(cacheKeys.enkaResponse(uid), data, ttl);
}

// Get cached Enka response
export async function getCachedEnkaResponse<T>(uid: string): Promise<T | null> {
  return getCachedJson<T>(cacheKeys.enkaResponse(uid));
}

// Retrieve stale Enka response when fresh fetch fails (stale-if-error)
export async function getStaleEnkaResponse<T>(uid: string): Promise<T | null> {
  const key = cacheKeys.enkaResponse(uid);
  return (lastKnownGoodMap.get(key) as T) || null;
}

// Get remaining TTL for cached response
export async function getCachedEnkaTTL(uid: string): Promise<number> {
  const key = cacheKeys.enkaResponse(uid);
  const client = getRedis();

  if (client) {
    try {
      const ttl = await client.ttl(key);
      return Math.max(0, ttl);
    } catch (err) {
      tripRedisCooldown(err);
    }
  }

  // Fallback to in-memory cache
  const entry = memoryCache.get(key);
  if (!entry) return 0;

  const remainingMs = entry.expiresAt - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

// Rate limiting: sliding window
export async function checkRateLimit(ip: string, limit: number = 10, windowSeconds: number = 60): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
}> {
  const key = cacheKeys.rateLimit(ip);
  const client = getRedis();

  if (client) {
    try {
      const current = await client.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await client.expire(key, windowSeconds);
      }

      const ttl = await client.ttl(key);
      const allowed = current <= limit;

      return {
        allowed,
        remaining: Math.max(0, limit - current),
        resetIn: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (err) {
      tripRedisCooldown(err);
    }
  }

  // In-memory rate limiting fallback
  const now = Date.now();
  const entry = memoryRateLimit.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    memoryRateLimit.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetIn: windowSeconds,
    };
  }

  entry.count += 1;
  const allowed = entry.count <= limit;
  const resetIn = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetIn,
  };
}

// Clear rate limit (for testing)
export async function clearRateLimit(ip: string) {
  const key = cacheKeys.rateLimit(ip);
  const client = getRedis();

  if (client) {
    try {
      await client.del(key);
    } catch {
      // Ignore
    }
  }

  memoryRateLimit.delete(key);
}
