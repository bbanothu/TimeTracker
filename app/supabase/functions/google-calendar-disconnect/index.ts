import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  corsHeaders,
  createAdminClient,
  getUserFromRequest,
  jsonResponse,
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

    const { data: connection, error } = await admin
      .from('user_google_calendar')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!connection) {
      return jsonResponse({ error: 'Google Calendar not connected' }, 404);
    }

    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: connection.refresh_token as string }),
      });
    } catch {
      // Best-effort revoke; still delete local connection.
    }

    await admin.from('user_google_calendar').delete().eq('user_id', user.id);

    return jsonResponse({ disconnected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
