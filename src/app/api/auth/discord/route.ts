import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;

  // Determine redirect URI based on current request host
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/discord/callback`;

  if (!clientId) {
    // Graceful helpful configuration guidance
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Discord OAuth Setup - Genbuilds</title>
  <style>
    body { background: #0a0c14; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #121526; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    h1 { font-size: 20px; margin-top: 0; color: #5865F2; display: flex; align-items: center; gap: 8px; }
    p { font-size: 13px; line-height: 1.6; color: #9ca3af; }
    ol { font-size: 13px; line-height: 1.8; color: #d1d5db; padding-left: 20px; }
    code { background: #1e233d; color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-size: 12px; }
    a.btn { display: inline-block; background: #5865F2; color: #fff; padding: 10px 18px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px; margin-top: 14px; }
    a.btn:hover { background: #4752c4; }
    .back { display: block; margin-top: 16px; color: #6b7280; font-size: 12px; text-decoration: none; }
    .back:hover { color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>
      <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
      Discord OAuth Setup
    </h1>
    <p>Discord Login is <strong>100% free</strong> and takes 2 minutes to set up:</p>
    <ol>
      <li>Go to <a href="https://discord.com/developers/applications" target="_blank" style="color: #38bdf8;">Discord Developer Portal</a>.</li>
      <li>Click <strong>New Application</strong> &rarr; Name it <strong>Genbuilds</strong>.</li>
      <li>Go to <strong>OAuth2</strong> &rarr; Add Redirect: <br><code>${redirectUri}</code></li>
      <li>Copy your <strong>Client ID</strong> & <strong>Client Secret</strong> into your <code>.env</code> file:
        <br><code>DISCORD_CLIENT_ID=your_id</code>
        <br><code>DISCORD_CLIENT_SECRET=your_secret</code>
      </li>
    </ol>
    <a href="https://discord.com/developers/applications" target="_blank" class="btn">Open Discord Developer Portal</a>
    <a href="/" class="back">&larr; Back to Genbuilds</a>
  </div>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Discord OAuth2 authorization URL
  const state = Math.random().toString(36).substring(2, 15);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state,
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  return NextResponse.redirect(discordAuthUrl);
}
