import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  corsHeaders,
  createAdminClient,
  getUserFromRequest,
  getValidAccessToken,
  jsonResponse,
} from '../_shared/googleCalendar.ts';
import { resetAndSyncGoogleCalendar, syncCompletedEntries } from '../_shared/googleCalendarSync.ts';

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

    const body = await req.json().catch(() => ({}));
    const reset = body?.reset === true;

    const result = reset
      ? await resetAndSyncGoogleCalendar(admin, user.id, accessToken, calendarId)
      : await syncCompletedEntries(admin, user.id, accessToken, calendarId);

    if (result.created > 0) {
      await admin
        .from('user_google_calendar')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
