import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByUsernameOrEmail,
  verifyPassword,
  createSessionToken,
  setAuthCookie,
  saveUser,
  generateVerificationCode,
} from '@/lib/auth';
import type { User } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, isQuickLogin, linkedUid } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
    }

    let user: User | null = await findUserByUsernameOrEmail(identifier);

    // If Quick Login mode (instant access without password):
    if (isQuickLogin) {
      if (!user) {
        // Auto-create lightweight user
        const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        user = {
          id: newId,
          username: identifier.trim(),
          email: null,
          passwordHash: null,
          linkedUid: linkedUid ? String(linkedUid).trim() : null,
          isVerified: false,
          verificationCode: generateVerificationCode(),
          avatarUrl: linkedUid ? `https://enka.network/ui/UI_AvatarIcon_Citlali.png` : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await saveUser(user);
      } else if (linkedUid && !user.linkedUid) {
        user.linkedUid = String(linkedUid).trim();
        await saveUser(user);
      }
    } else {
      // Standard password login
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }

      const isValid = await verifyPassword(password || '', user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }
    }

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      linkedUid: user.linkedUid,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
    };

    const token = await createSessionToken(sessionPayload);
    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        linkedUid: user.linkedUid,
        isVerified: user.isVerified,
        verificationCode: user.verificationCode,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[API Login] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
