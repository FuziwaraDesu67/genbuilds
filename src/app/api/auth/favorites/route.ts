import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, getUserFavorites, toggleUserFavorite } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ favorites: [] });
    }

    const list = await getUserFavorites(session.userId);
    return NextResponse.json({ favorites: list });
  } catch (err) {
    console.error('[API Favorites GET] Error:', err);
    return NextResponse.json({ favorites: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to save favorites' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUid, targetNickname, targetAvatarUrl } = body;

    if (!targetUid) {
      return NextResponse.json({ error: 'Target UID is required' }, { status: 400 });
    }

    const result = await toggleUserFavorite(session.userId, targetUid, targetNickname, targetAvatarUrl);
    const updatedFavorites = await getUserFavorites(session.userId);

    return NextResponse.json({
      success: true,
      favorited: result.favorited,
      favorites: updatedFavorites,
    });
  } catch (err) {
    console.error('[API Favorites POST] Error:', err);
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 });
  }
}
