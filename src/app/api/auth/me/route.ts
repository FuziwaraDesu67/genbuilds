import { NextResponse } from 'next/server';
import { getCurrentSession, findUserById, getUserFavorites } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null, favorites: [] });
    }

    const fullUser = await findUserById(session.userId);
    const favorites = await getUserFavorites(session.userId);

    const userPayload = {
      id: session.userId,
      username: fullUser?.username || session.username,
      email: fullUser?.email || session.email,
      linkedUid: fullUser?.linkedUid || session.linkedUid,
      isVerified: fullUser?.isVerified ?? session.isVerified ?? false,
      verificationCode: fullUser?.verificationCode,
      avatarUrl: fullUser?.avatarUrl || session.avatarUrl,
    };

    return NextResponse.json({
      user: userPayload,
      favorites,
    });
  } catch (error) {
    console.error('[API Auth Me] Error:', error);
    return NextResponse.json({ user: null, favorites: [] }, { status: 500 });
  }
}
