import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { GoogleCalendarStatus, GoogleCalendarSyncResult } from '@/types/googleCalendar';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

WebBrowser.maybeCompleteAuthSession();

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in to use Google Calendar');
  return session.access_token;
}

async function invokeFunction<T>(
  functionName: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.error === 'string' ? payload.error : 'Google Calendar request failed',
    );
  }

  return payload as T;
}

export async function getGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  return invokeFunction<GoogleCalendarStatus>('google-calendar-status');
}

export async function startGoogleCalendarConnect(returnTo: string): Promise<string> {
  const result = await invokeFunction<{ url: string }>('google-calendar-connect', {
    method: 'POST',
    body: { returnTo },
  });
  if (!result.url) throw new Error('Google authorization URL was not returned');
  return result.url;
}

export async function connectGoogleCalendarInBrowser(): Promise<boolean> {
  const returnTo = Linking.createURL('/profile', { queryParams: { calendar: 'connected' } });
  const authUrl = await startGoogleCalendarConnect(returnTo);
  const result = await WebBrowser.openAuthSessionAsync(authUrl, returnTo);
  return result.type === 'success';
}

export async function syncGoogleCalendar(): Promise<GoogleCalendarSyncResult> {
  return invokeFunction<GoogleCalendarSyncResult>('google-calendar-sync', { method: 'POST' });
}

export async function resetAndSyncGoogleCalendar(): Promise<GoogleCalendarSyncResult> {
  return invokeFunction<GoogleCalendarSyncResult>('google-calendar-sync', {
    method: 'POST',
    body: { reset: true },
  });
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await invokeFunction<{ disconnected: boolean }>('google-calendar-disconnect', {
    method: 'POST',
  });
}
