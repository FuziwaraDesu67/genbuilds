import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByUsernameOrEmail,
  hashPassword,
  createSessionToken,
  setAuthCookie,
  saveUser,
  generateVerificationCode,
} from '@/lib/auth';
import type { User } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, linkedUid } = body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    const existing = await findUserByUsernameOrEmail(username);
    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: User = {
      id: newId,
      username: username.trim(),
      email: email ? String(email).trim().toLowerCase() : null,
      passwordHash,
      linkedUid: linkedUid ? String(linkedUid).trim() : null,
      isVerified: false,
      verificationCode: generateVerificationCode(),
      avatarUrl: linkedUid ? `https://enka.network/ui/UI_AvatarIcon_Citlali.png` : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveUser(newUser);

    const sessionPayload = {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      linkedUid: newUser.linkedUid,
      isVerified: newUser.isVerified,
      avatarUrl: newUser.avatarUrl,
    };

    const token = await createSessionToken(sessionPayload);
    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        linkedUid: newUser.linkedUid,
        isVerified: newUser.isVerified,
        verificationCode: newUser.verificationCode,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[API Register] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
