import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByUsernameOrEmail,
  saveUser,
  createSessionToken,
  setAuthCookie,
  generateVerificationCode,
} from '@/lib/auth';
import type { User } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${proto}://${host}/?error=no_discord_code`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${proto}://${host}/?error=discord_credentials_missing`);
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[Discord OAuth] Token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${proto}://${host}/?error=discord_token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Discord user profile
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${proto}://${host}/?error=discord_user_fetch_failed`);
    }

    const discordUser = await userRes.json();

    // 3. Resolve user in repository
    const username = discordUser.global_name || discordUser.username || `Discord_${discordUser.id}`;
    const email = discordUser.email || null;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.id) % 5}.png`;

    let user: User | null = await findUserByUsernameOrEmail(username);
    if (!user && email) {
      user = await findUserByUsernameOrEmail(email);
    }

    if (!user) {
      // Create new user linked with Discord
      user = {
        id: `usr_discord_${discordUser.id}`,
        username,
        email,
        passwordHash: null,
        linkedUid: null,
        isVerified: false,
        verificationCode: generateVerificationCode(),
        avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await saveUser(user);
    } else {
      // Update avatar if not already set
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
        await saveUser(user);
      }
    }

    // 4. Create and set session cookie
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

    // Redirect to showcase if they have a linked UID, otherwise home
    if (user.linkedUid) {
      return NextResponse.redirect(`${proto}://${host}/u/${user.linkedUid}`);
    }
    return NextResponse.redirect(`${proto}://${host}/`);
  } catch (err) {
    console.error('[Discord OAuth] Error:', err);
    return NextResponse.redirect(`${proto}://${host}/?error=discord_login_error`);
  }
}
