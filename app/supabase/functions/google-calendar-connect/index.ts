import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  corsHeaders,
  createAdminClient,
  getEnv,
  getGoogleRedirectUri,
  getUserFromRequest,
  GOOGLE_OAUTH_SCOPES,
  jsonResponse,
  resolveGoogleEmail,
} from '../_shared/googleCalendar.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createAdminClient();
    const url = new URL(req.url);

    if (req.method === 'GET' && url.searchParams.get('code')) {
      return await handleCallback(admin, url);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const user = await getUserFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const returnTo = typeof body.returnTo === 'string' ? body.returnTo.trim() : '';
    if (!returnTo) {
      return jsonResponse({ error: 'returnTo is required' }, 400);
    }

    const { data: stateRow, error: stateError } = await admin
      .from('google_calendar_oauth_states')
      .insert({ user_id: user.id, return_to: returnTo })
      .select('id')
      .single();

    if (stateError || !stateRow) {
      return jsonResponse({ error: 'Failed to start OAuth flow' }, 500);
    }

    const redirectUri = getGoogleRedirectUri();
    const params = new URLSearchParams({
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_OAUTH_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: stateRow.id as string,
    });

    return jsonResponse({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});

async function handleCallback(
  admin: ReturnType<typeof createAdminClient>,
  url: URL,
): Promise<Response> {
  const code = url.searchParams.get('code');
  const stateId = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return new Response(`Google authorization failed: ${oauthError}`, {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!code || !stateId) {
    return new Response('Missing code or state', { status: 400, headers: corsHeaders });
  }

  const { data: stateRow, error: stateError } = await admin
    .from('google_calendar_oauth_states')
    .select('user_id, return_to, created_at')
    .eq('id', stateId)
    .maybeSingle();

  if (stateError || !stateRow) {
    return new Response('Invalid or expired OAuth state', { status: 400, headers: corsHeaders });
  }

  const createdAt = new Date(stateRow.created_at as string).getTime();
  if (Date.now() - createdAt > 15 * 60 * 1000) {
    await admin.from('google_calendar_oauth_states').delete().eq('id', stateId);
    return new Response('OAuth state expired', { status: 400, headers: corsHeaders });
  }

  const redirectUri = getGoogleRedirectUri();
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    return new Response(`Token exchange failed: ${text}`, { status: 500, headers: corsHeaders });
  }

  const tokenJson = await tokenResponse.json();
  const refreshToken = tokenJson.refresh_token as string | undefined;
  const accessToken = tokenJson.access_token as string | undefined;
  const idToken = tokenJson.id_token as string | undefined;

  if (!refreshToken || !accessToken) {
    return new Response(
      'Google did not return refresh token. Try disconnecting and reconnecting.',
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }

  const googleEmail = await resolveGoogleEmail(accessToken, idToken);
  const expiresIn = Number(tokenJson.expires_in ?? 3600);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const userId = stateRow.user_id as string;

  const { error: upsertError } = await admin.from('user_google_calendar').upsert({
    user_id: userId,
    google_email: googleEmail,
    refresh_token: refreshToken,
    access_token: accessToken,
    token_expires_at: tokenExpiresAt,
    calendar_id: 'primary',
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return new Response('Failed to save Google connection', { status: 500, headers: corsHeaders });
  }

  await admin.from('google_calendar_oauth_states').delete().eq('id', stateId);

  const returnTo = new URL(stateRow.return_to as string);
  returnTo.searchParams.set('calendar', 'connected');
  return Response.redirect(returnTo.toString(), 302);
}
