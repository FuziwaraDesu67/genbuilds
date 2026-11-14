import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, favorites, type User } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface AuthSession {
  userId: string;
  username: string;
  email?: string | null;
  linkedUid?: string | null;
  isVerified?: boolean;
  avatarUrl?: string | null;
}

const AUTH_COOKIE_NAME = 'aether_auth_token';
const AUTH_SECRET = process.env.AUTH_SECRET || 'aether-rank-jwt-secret-key-genshin-314159';

// ── In-Memory Resilient Store (used when DATABASE_URL is not configured) ────
const memoryUsers = new Map<string, User>();
const memoryFavorites = new Map<string, Array<{ targetUid: string; targetNickname?: string; targetAvatarUrl?: string }>>();

// In-memory fallback starts clean with no pre-seeded personal accounts

// ── Web Crypto Helpers (Built-in, zero native dependencies) ────────────────
async function getSecretKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const hashHex = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [saltHex, expectedHashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const actualHashHex = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
  return actualHashHex === expectedHashHex;
}

// ── JWT-Style Stateless Token Generation & Verification ────────────────────
export async function createSessionToken(session: AuthSession): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
  const payload = { ...session, exp };

  const enc = new TextEncoder();
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${b64Header}.${b64Payload}`;

  const key = await getSecretKey();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const b64Signature = Buffer.from(signature).toString('base64url');

  return `${dataToSign}.${b64Signature}`;
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, b64Signature] = parts;
    const dataToVerify = `${b64Header}.${b64Payload}`;

    const key = await getSecretKey();
    const signature = Buffer.from(b64Signature, 'base64url');
    const enc = new TextEncoder();

    const isValid = await crypto.subtle.verify('HMAC', key, signature, enc.encode(dataToVerify));
    if (!isValid) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      linkedUid: payload.linkedUid,
      isVerified: payload.isVerified,
      avatarUrl: payload.avatarUrl,
    };
  } catch {
    return null;
  }
}

export function generateVerificationCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `AK-${num}`;
}

// ── Cookie Helpers ────────────────────────────────────────────────────────
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export function removeAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function getAuthTokenFromCookies(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const token = getAuthTokenFromCookies();
  if (!token) return null;
  return verifySessionToken(token);
}

// ── User Repository (DB + Resilient Fallback) ──────────────────────────────
export async function findUserById(id: string): Promise<User | null> {
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (rows[0]) return rows[0];
    }
  } catch (e) {
    console.warn('[Auth] DB lookup failed, checking in-memory store:', (e as Error).message);
  }
  return memoryUsers.get(id) || null;
}

export async function findUserByUsernameOrEmail(identifier: string): Promise<User | null> {
  const norm = identifier.trim().toLowerCase();

  try {
    if (process.env.DATABASE_URL) {
      const rows = await db.select().from(users);
      const match = rows.find(u => u.username.toLowerCase() === norm || (u.email && u.email.toLowerCase() === norm));
      if (match) return match;
    }
  } catch (e) {
    console.warn('[Auth] DB query failed, using in-memory store:', (e as Error).message);
  }

  for (const u of Array.from(memoryUsers.values())) {
    if (u.username.toLowerCase() === norm || (u.email && u.email.toLowerCase() === norm)) {
      return u;
    }
  }
  return null;
}

export async function saveUser(user: User): Promise<User> {
  memoryUsers.set(user.id, user);

  try {
    if (process.env.DATABASE_URL) {
      await db.insert(users).values(user).onConflictDoUpdate({
        target: users.id,
        set: {
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          linkedUid: user.linkedUid,
          isVerified: user.isVerified,
          verificationCode: user.verificationCode,
          avatarUrl: user.avatarUrl,
          updatedAt: new Date(),
        },
      });
    }
  } catch (e) {
    console.warn('[Auth] DB save failed, saved in memory:', (e as Error).message);
  }

  return user;
}

// ── Favorites Repository ──────────────────────────────────────────────────
export async function getUserFavorites(userId: string) {
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
      if (rows.length > 0) return rows;
    }
  } catch (e) {
    console.warn('[Auth] DB favorites lookup failed, using memory:', (e as Error).message);
  }

  const list = memoryFavorites.get(userId) || [];
  return list.map((item, idx) => ({
    id: idx + 1,
    userId,
    targetUid: item.targetUid,
    targetNickname: item.targetNickname || `Player ${item.targetUid}`,
    targetAvatarUrl: item.targetAvatarUrl || null,
    createdAt: new Date(),
  }));
}

export async function toggleUserFavorite(userId: string, targetUid: string, targetNickname?: string, targetAvatarUrl?: string) {
  const current = memoryFavorites.get(userId) || [];
  const exists = current.some(f => f.targetUid === targetUid);

  if (exists) {
    memoryFavorites.set(userId, current.filter(f => f.targetUid !== targetUid));
    try {
      if (process.env.DATABASE_URL) {
        await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.targetUid, targetUid)));
      }
    } catch {}
    return { favorited: false };
  } else {
    current.push({ targetUid, targetNickname, targetAvatarUrl });
    memoryFavorites.set(userId, current);
    try {
      if (process.env.DATABASE_URL) {
        await db.insert(favorites).values({
          userId,
          targetUid,
          targetNickname: targetNickname || null,
          targetAvatarUrl: targetAvatarUrl || null,
        });
      }
    } catch {}
    return { favorited: true };
  }
}
