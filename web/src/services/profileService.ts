import { supabase } from '@/lib/supabase';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export function buildProfileDisplayName(profile: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
}): string | null {
  const full = `${profile.firstName?.trim() ?? ''} ${profile.lastName?.trim() ?? ''}`.trim();
  if (full) return full;
  const legacy = profile.displayName?.trim();
  return legacy || null;
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    firstName: data?.first_name?.trim() ?? '',
    lastName: data?.last_name?.trim() ?? '',
    email: data?.email ?? user.email ?? '',
  };
}

export async function updateMyProfileNames(firstName: string, lastName: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error('Not signed in');

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const email = (user.email ?? '').trim().toLowerCase();

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      email,
      first_name: trimmedFirst || null,
      last_name: trimmedLast || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}
