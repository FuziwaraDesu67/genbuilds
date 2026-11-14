/// <reference types="vitest/globals" />
import {
  cacheEnkaResponse,
  getCachedEnkaResponse,
  getCachedEnkaTTL,
  checkRateLimit,
  clearRateLimit
} from '../src/lib/redis';

describe('Redis & In-Memory Fallback', () => {
  it('should store and retrieve cached response with TTL fallback', async () => {
    const testUid = '999999999';
    const sampleData = { player: { uid: testUid, nickname: 'TestTraveller' } };

    await cacheEnkaResponse(testUid, sampleData, 60);

    const retrieved = await getCachedEnkaResponse<typeof sampleData>(testUid);
    expect(retrieved).toBeDefined();
    expect(retrieved?.player.nickname).toBe('TestTraveller');

    const ttl = await getCachedEnkaTTL(testUid);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('should enforce rate limits correctly with in-memory fallback', async () => {
    const testIp = '192.168.1.100';
    await clearRateLimit(testIp);

    // First request: should be allowed
    const firstCheck = await checkRateLimit(testIp, 2, 30);
    expect(firstCheck.allowed).toBe(true);
    expect(firstCheck.remaining).toBe(1);

    // Second request: should still be allowed
    const secondCheck = await checkRateLimit(testIp, 2, 30);
    expect(secondCheck.allowed).toBe(true);
    expect(secondCheck.remaining).toBe(0);

    // Third request: should be blocked
    const thirdCheck = await checkRateLimit(testIp, 2, 30);
    expect(thirdCheck.allowed).toBe(false);

    // Clean up
    await clearRateLimit(testIp);
  });
});
