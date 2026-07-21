import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  corsHeaders,
  createAdminClient,
  getEnv,
  getUserFromRequest,
  jsonResponse,
} from '../_shared/googleCalendar.ts';

const PROFILE_BUCKET = 'Profile';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user.email) {
      return jsonResponse({ error: 'Account has no email; cannot verify password' }, 400);
    }

    const body = (await req.json().catch(() => ({}))) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) {
      return jsonResponse({ error: 'Password is required' }, 400);
    }

    const anon = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'));
    const { error: verifyError } = await anon.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (verifyError) {
      return jsonResponse({ error: 'Password is incorrect' }, 403);
    }

    const admin = createAdminClient();

    const { data: connection } = await admin
      .from('user_google_calendar')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (connection?.refresh_token) {
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: connection.refresh_token as string }),
        });
      } catch {
        // Best-effort revoke.
      }
    }

    try {
      await admin.storage.from(PROFILE_BUCKET).remove([`${user.id}.jpg`]);
    } catch {
      // Photo may not exist.
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return jsonResponse({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized' || message === 'Missing authorization header' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
