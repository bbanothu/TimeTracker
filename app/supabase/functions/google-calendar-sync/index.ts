import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  buildCalendarEvent,
  corsHeaders,
  createAdminClient,
  getUserFromRequest,
  getValidAccessToken,
  jsonResponse,
  type EntryRow,
  type GeofenceRow,
  type TagRow,
} from '../_shared/googleCalendar.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    const admin = createAdminClient();
    const { accessToken, calendarId } = await getValidAccessToken(admin, user.id);

    const { data: entries, error: entriesError } = await admin
      .from('time_entries')
      .select(
        'id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details',
      )
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: true });

    if (entriesError) throw entriesError;

    const allEntries = (entries ?? []) as EntryRow[];
    if (allEntries.length === 0) {
      return jsonResponse({ created: 0, skipped: 0, failed: 0 });
    }

    const entryIds = allEntries.map((entry) => entry.id);
    const { data: syncedRows, error: syncedError } = await admin
      .from('calendar_event_sync')
      .select('entry_id')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .in('entry_id', entryIds);

    if (syncedError) throw syncedError;

    const syncedIds = new Set((syncedRows ?? []).map((row) => row.entry_id as string));
    const unsyncedEntries = allEntries.filter((entry) => !syncedIds.has(entry.id));

    let created = 0;
    let skipped = syncedIds.size;
    let failed = 0;

    for (const entry of unsyncedEntries) {
      try {
        const { data: tagLinks, error: tagLinksError } = await admin
          .from('time_entry_tags')
          .select('tag_id, tags(id, name)')
          .eq('entry_id', entry.id)
          .eq('user_id', user.id);

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
            .eq('user_id', user.id)
            .maybeSingle();

          if (geofenceError) throw geofenceError;
          geofence = (geofenceRow as GeofenceRow | null) ?? null;
        }

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

        if (!createResponse.ok) {
          failed += 1;
          continue;
        }

        const createdEvent = await createResponse.json();
        const externalEventId = createdEvent.id as string | undefined;
        if (!externalEventId) {
          failed += 1;
          continue;
        }

        const { error: insertError } = await admin.from('calendar_event_sync').insert({
          entry_id: entry.id,
          user_id: user.id,
          provider: 'google',
          external_event_id: externalEventId,
        });

        if (insertError) {
          failed += 1;
          continue;
        }

        created += 1;
      } catch {
        failed += 1;
      }
    }

    if (created > 0) {
      await admin
        .from('user_google_calendar')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return jsonResponse({ created, skipped, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
