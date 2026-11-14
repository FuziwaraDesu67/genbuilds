import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateVerificationCode,
  findUserById,
  saveUser,
  toggleUserFavorite,
  getUserFavorites,
} from '@/lib/auth';

describe('Built-in 100% Free Authentication Engine', () => {
  it('correctly hashes and verifies passwords using PBKDF2', async () => {
    const password = 'mySecretPassword123!';
    const hash = await hashPassword(password);
    expect(hash).toContain(':');

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('generates and verifies signed session tokens (stateless JWT)', async () => {
    const sessionPayload = {
      userId: 'usr_test_123',
      username: 'TravelerMain',
      email: 'traveler@aetherrank.gg',
      linkedUid: '855842984',
      isVerified: true,
      avatarUrl: 'https://enka.network/ui/UI_AvatarIcon_Citlali.png',
    };

    const token = await createSessionToken(sessionPayload);
    expect(token.split('.').length).toBe(3);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr_test_123');
    expect(decoded?.username).toBe('TravelerMain');
    expect(decoded?.linkedUid).toBe('855842984');
    expect(decoded?.isVerified).toBe(true);
  });

  it('rejects tampered session tokens', async () => {
    const sessionPayload = {
      userId: 'usr_legit',
      username: 'LegitPlayer',
    };

    const token = await createSessionToken(sessionPayload);
    const parts = token.split('.');
    // Tamper with the payload
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'usr_hacked', username: 'Hacker' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const decoded = await verifySessionToken(tamperedToken);
    expect(decoded).toBeNull();
  });

  it('generates 4-digit verification codes matching AK-XXXX format', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^AK-\d{4}$/);
  });

  it('saves and retrieves user from repository', async () => {
    const testUser = {
      id: 'usr_unit_test',
      username: 'ChascaEnthusiast',
      email: 'chasca@test.com',
      passwordHash: 'dummy',
      linkedUid: '100000001',
      isVerified: false,
      verificationCode: 'AK-1111',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveUser(testUser);
    const retrieved = await findUserById('usr_unit_test');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.username).toBe('ChascaEnthusiast');
    expect(retrieved?.linkedUid).toBe('100000001');
  });

  it('correctly toggles and persists favorites', async () => {
    const userId = 'usr_fav_tester';
    const targetUid = '855842984';

    // Toggle ON
    const firstToggle = await toggleUserFavorite(userId, targetUid, 'AnirudhArcade');
    expect(firstToggle.favorited).toBe(true);

    let favs = await getUserFavorites(userId);
    expect(favs.some(f => f.targetUid === targetUid)).toBe(true);

    // Toggle OFF
    const secondToggle = await toggleUserFavorite(userId, targetUid);
    expect(secondToggle.favorited).toBe(false);

    favs = await getUserFavorites(userId);
    expect(favs.some(f => f.targetUid === targetUid)).toBe(false);
  });
});
