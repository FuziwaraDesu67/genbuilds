import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, findUserById, saveUser, createSessionToken, setAuthCookie } from '@/lib/auth';
import { UIDSchema } from '@/lib/enka/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { uid, avatarUrl } = body;

    const parseResult = UIDSchema.safeParse(uid);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'UID must be 9 or 10 digits' }, { status: 400 });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.linkedUid = parseResult.data;
    if (avatarUrl) {
      user.avatarUrl = avatarUrl;
    }
    user.isVerified = false; // Reset verification status when UID changes

    await saveUser(user);

    const updatedSession = {
      ...session,
      linkedUid: user.linkedUid,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
    };

    const token = await createSessionToken(updatedSession);
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
    console.error('[API Link UID] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
