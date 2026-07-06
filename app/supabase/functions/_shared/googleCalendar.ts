import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { googleColorIdForHex } from './googleCalendarColors.ts';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export const GOOGLE_OAUTH_SCOPES = [GOOGLE_CALENDAR_SCOPE, 'openid', 'email'].join(' ');

export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.email === 'string' ? decoded.email : null;
  } catch {
    return null;
  }
}

export async function resolveGoogleEmail(accessToken: string, idToken?: string): Promise<string> {
  const fromIdToken = emailFromIdToken(idToken);
  if (fromIdToken) return fromIdToken;

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (userInfoResponse.ok) {
    const userInfo = await userInfoResponse.json();
    if (typeof userInfo.email === 'string' && userInfo.email.length > 0) {
      return userInfo.email;
    }
  }

  return 'Google Calendar';
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getGoogleRedirectUri(): string {
  const supabaseUrl = getEnv('SUPABASE_URL').replace(/\/$/, '');
  return `${supabaseUrl}/functions/v1/google-calendar-connect`;
}

export function createAdminClient(): SupabaseClient {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export async function getUserFromRequest(req: Request): Promise<{ id: string; email?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');

  const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Unauthorized');
  return { id: user.id, email: user.email ?? undefined };
}

export type EntryRow = {
  id: string;
  user_id: string;
  started_at: number;
  ended_at: number;
  source: string;
  geofence_id: string | null;
  stop_latitude: number | null;
  stop_longitude: number | null;
  details: string | null;
};

export type TagRow = { id: string; name: string; color: string; description?: string | null };

export type GeofenceRow = { id: string; name: string };

function formatDurationMs(durationMs: number): string {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function buildCalendarEvent(
  entry: EntryRow,
  tags: TagRow[],
  geofence: GeofenceRow | null,
): Record<string, unknown> {
  const title = tags.map((tag) => tag.name).join(', ') || 'Time tracked';
  const descriptionParts: string[] = [];

  const sessionDetails = entry.details?.trim();
  if (sessionDetails) {
    descriptionParts.push(`Details: ${sessionDetails}`);
  }

  for (const tag of tags) {
    const tagDescription = tag.description?.trim();
    if (tagDescription) {
      descriptionParts.push(`${tag.name}: ${tagDescription}`);
    }
  }

  const durationMs = entry.ended_at - entry.started_at;
  if (durationMs > 0) {
    descriptionParts.push(`Duration: ${formatDurationMs(durationMs)}`);
  }

  descriptionParts.push(`Source: ${entry.source}`);
  if (geofence) descriptionParts.push(`Place: ${geofence.name}`);

  let location: string | undefined;
  if (geofence) {
    location = geofence.name;
  } else if (entry.stop_latitude != null && entry.stop_longitude != null) {
    location = `${entry.stop_latitude},${entry.stop_longitude}`;
  }

  const event: Record<string, unknown> = {
    summary: title,
    description: descriptionParts.join('\n'),
    start: {
      dateTime: new Date(entry.started_at).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(entry.ended_at).toISOString(),
      timeZone: 'UTC',
    },
  };

  const primaryTagColor = tags[0]?.color;
  if (primaryTagColor) {
    event.colorId = googleColorIdForHex(primaryTagColor);
  }

  if (location) event.location = location;
  return event;
}

export async function getValidAccessToken(
  admin: SupabaseClient,
  userId: string,
): Promise<{ accessToken: string; calendarId: string }> {
  const { data: connection, error } = await admin
    .from('user_google_calendar')
    .select('refresh_token, access_token, token_expires_at, calendar_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !connection) throw new Error('Google Calendar not connected');

  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const stillValid = connection.access_token && expiresAt > Date.now() + 60_000;

  if (stillValid) {
    return {
      accessToken: connection.access_token as string,
      calendarId: (connection.calendar_id as string) || 'primary',
    };
  }

  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token as string,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Failed to refresh Google token: ${text}`);
  }

  const tokenJson = await tokenResponse.json();
  const accessToken = tokenJson.access_token as string;
  const expiresIn = Number(tokenJson.expires_in ?? 3600);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin
    .from('user_google_calendar')
    .update({
      access_token: accessToken,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return {
    accessToken,
    calendarId: (connection.calendar_id as string) || 'primary',
  };
}

export async function countPendingEntries(admin: SupabaseClient, userId: string): Promise<number> {
  const { data: entries, error: entriesError } = await admin
    .from('time_entries')
    .select('id')
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  if (entriesError) throw entriesError;

  const entryIds = (entries ?? []).map((row) => row.id as string);
  if (entryIds.length === 0) return 0;

  const { data: synced, error: syncedError } = await admin
    .from('calendar_event_sync')
    .select('entry_id')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .in('entry_id', entryIds);

  if (syncedError) throw syncedError;

  const syncedIds = new Set((synced ?? []).map((row) => row.entry_id as string));
  return entryIds.filter((id) => !syncedIds.has(id)).length;
}
