import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  corsHeaders,
  countPendingEntries,
  createAdminClient,
  getUserFromRequest,
  jsonResponse,
} from '../_shared/googleCalendar.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    const admin = createAdminClient();

    const { data: connection, error } = await admin
      .from('user_google_calendar')
      .select('google_email, last_synced_at, connected_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!connection) {
      return jsonResponse({
        connected: false,
        googleEmail: null,
        pendingCount: 0,
        lastSyncedAt: null,
      });
    }

    const pendingCount = await countPendingEntries(admin, user.id);

    return jsonResponse({
      connected: true,
      googleEmail: connection.google_email,
      pendingCount,
      lastSyncedAt: connection.last_synced_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
