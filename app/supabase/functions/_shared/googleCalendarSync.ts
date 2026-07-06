import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  buildCalendarEvent,
  type EntryRow,
  type GeofenceRow,
  type TagRow,
} from './googleCalendar.ts';

export interface GoogleCalendarSyncCounts {
  created: number;
  skipped: number;
  failed: number;
}

export interface GoogleCalendarResetCounts extends GoogleCalendarSyncCounts {
  removed: number;
  removeFailed: number;
}

async function loadEntryContext(
  admin: SupabaseClient,
  userId: string,
  entry: EntryRow,
): Promise<{ tags: TagRow[]; geofence: GeofenceRow | null }> {
  const { data: tagLinks, error: tagLinksError } = await admin
    .from('time_entry_tags')
    .select('tag_id, tags(id, name, color, description)')
    .eq('entry_id', entry.id)
    .eq('user_id', userId);

  if (tagLinksError) throw tagLinksError;

  const tags = (tagLinks ?? [])
    .map((row) => row.tags as TagRow | null)
    .filter((tag): tag is TagRow => tag != null);

  let geofence: GeofenceRow | null = null;
  if (entry.geofence_id) {
    const { data: geofenceRow, error: geofenceError } = await admin
      .from('geofences')
      .select('id, name')
      .eq('id', entry.geofence_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (geofenceError) throw geofenceError;
    geofence = (geofenceRow as GeofenceRow | null) ?? null;
  }

  return { tags, geofence };
}

async function createGoogleEventForEntry(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
  calendarId: string,
  entry: EntryRow,
): Promise<boolean> {
  const { tags, geofence } = await loadEntryContext(admin, userId, entry);
  const eventBody = buildCalendarEvent(entry, tags, geofence);
  const createResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    },
  );

  if (!createResponse.ok) return false;

  const createdEvent = await createResponse.json();
  const externalEventId = createdEvent.id as string | undefined;
  if (!externalEventId) return false;

  const { error: insertError } = await admin.from('calendar_event_sync').insert({
    entry_id: entry.id,
    user_id: userId,
    provider: 'google',
    external_event_id: externalEventId,
  });

  return !insertError;
}

export async function removeSyncedGoogleEvents(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
  calendarId: string,
): Promise<{ removed: number; removeFailed: number }> {
  const { data: syncedRows, error: syncedError } = await admin
    .from('calendar_event_sync')
    .select('external_event_id')
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (syncedError) throw syncedError;

  let removed = 0;
  let removeFailed = 0;

  for (const row of syncedRows ?? []) {
    const externalEventId = row.external_event_id as string | undefined;
    if (!externalEventId) {
      removeFailed += 1;
      continue;
    }

    try {
      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalEventId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (deleteResponse.ok || deleteResponse.status === 404 || deleteResponse.status === 410) {
        removed += 1;
      } else {
        removeFailed += 1;
      }
    } catch {
      removeFailed += 1;
    }
  }

  return { removed, removeFailed };
}

export async function syncCompletedEntries(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
  calendarId: string,
  options?: { onlyUnsynced?: boolean },
): Promise<GoogleCalendarSyncCounts> {
  const onlyUnsynced = options?.onlyUnsynced !== false;

  const { data: entries, error: entriesError } = await admin
    .from('time_entries')
    .select(
      'id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details',
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (entriesError) throw entriesError;

  const allEntries = (entries ?? []) as EntryRow[];
  if (allEntries.length === 0) {
    return { created: 0, skipped: 0, failed: 0 };
  }

  let entriesToSync = allEntries;
  let skipped = 0;

  if (onlyUnsynced) {
    const entryIds = allEntries.map((entry) => entry.id);
    const { data: syncedRows, error: syncedError } = await admin
      .from('calendar_event_sync')
      .select('entry_id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .in('entry_id', entryIds);

    if (syncedError) throw syncedError;

    const syncedIds = new Set((syncedRows ?? []).map((row) => row.entry_id as string));
    skipped = syncedIds.size;
    entriesToSync = allEntries.filter((entry) => !syncedIds.has(entry.id));
  }

  let created = 0;
  let failed = 0;

  for (const entry of entriesToSync) {
    try {
      const ok = await createGoogleEventForEntry(admin, userId, accessToken, calendarId, entry);
      if (ok) created += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return { created, skipped, failed };
}

export async function resetAndSyncGoogleCalendar(
  admin: SupabaseClient,
  userId: string,
  accessToken: string,
  calendarId: string,
): Promise<GoogleCalendarResetCounts> {
  const { removed, removeFailed } = await removeSyncedGoogleEvents(
    admin,
    userId,
    accessToken,
    calendarId,
  );

  const { error: clearError } = await admin
    .from('calendar_event_sync')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (clearError) throw clearError;

  const syncResult = await syncCompletedEntries(admin, userId, accessToken, calendarId, {
    onlyUnsynced: false,
  });

  return { removed, removeFailed, ...syncResult, skipped: 0 };
}
