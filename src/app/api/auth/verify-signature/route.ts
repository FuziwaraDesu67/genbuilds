import { NextResponse } from 'next/server';
import { getCurrentSession, findUserById, saveUser, createSessionToken, setAuthCookie } from '@/lib/auth';
import { enkaClient } from '@/lib/enka';

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findUserById(session.userId);
    if (!user || !user.linkedUid) {
      return NextResponse.json({ error: 'No linked UID to verify' }, { status: 400 });
    }

    if (!user.verificationCode) {
      return NextResponse.json({ error: 'No verification code issued' }, { status: 400 });
    }

    // Fetch live profile from Enka
    const enkaData = await enkaClient.fetchPlayerData(user.linkedUid);
    const signature = enkaData.player.signature || '';

    // Check if in-game signature contains the verification code
    const isMatched = signature.toLowerCase().includes(user.verificationCode.toLowerCase());

    if (!isMatched) {
      return NextResponse.json({
        verified: false,
        message: `Verification code "${user.verificationCode}" was not found in your in-game signature. Current signature: "${signature}". Please update your signature in Genshin Impact and try again.`,
      }, { status: 400 });
    }

    // Success! Mark user as verified
    user.isVerified = true;
    if (enkaData.player.profilePicture) {
      user.avatarUrl = enkaData.player.profilePicture;
    }
    await saveUser(user);

    const updatedSession = {
      ...session,
      isVerified: true,
      avatarUrl: user.avatarUrl,
    };

    const token = await createSessionToken(updatedSession);
    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'UID ownership verified successfully!',
      user: {
        id: user.id,
        username: user.username,
        linkedUid: user.linkedUid,
        isVerified: true,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[API Verify Signature] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to verify signature' }, { status: 500 });
  }
}
