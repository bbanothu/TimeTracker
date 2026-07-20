import { createClient } from '@supabase/supabase-js';

import { useHashRouter } from '@/lib/isElectron';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // HashRouter uses the URL fragment; disable on file:// so routing is not broken.
      detectSessionInUrl: typeof window === 'undefined' ? true : !useHashRouter(),
    },
  },
);
