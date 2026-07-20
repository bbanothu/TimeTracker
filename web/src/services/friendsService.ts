import { supabase } from '@/lib/supabase';
import { buildProfileDisplayName } from '@/services/profileService';
import { fetchAllEntries, fetchGeofences } from '@/services/data';
import type {
  Friendship,
  FriendshipOtherUser,
  FriendshipStatus,
  Geofence,
  TimeEntry,
} from '@/types';

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
};

type ProfileRow = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

export function friendLabel(user: FriendshipOtherUser): string {
  const name = user.displayName?.trim();
  if (name) return name;
  return user.email;
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name, display_name')
    .in('user_id', userIds);

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.user_id, row as ProfileRow]));
}

function mapFriendship(
  row: FriendshipRow,
  me: string,
  profiles: Map<string, ProfileRow>,
): Friendship {
  const otherId = row.requester_id === me ? row.addressee_id : row.requester_id;
  const profile = profiles.get(otherId);
  const otherUser: FriendshipOtherUser = {
    userId: otherId,
    email: profile?.email ?? 'unknown',
    displayName: profile
      ? buildProfileDisplayName({
          firstName: profile.first_name,
          lastName: profile.last_name,
          displayName: profile.display_name,
        })
      : null,
  };

  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    otherUser,
  };
}

export async function fetchIncomingPendingCount(): Promise<number> {
  const me = await getCurrentUserId();
  const { count, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', me)
    .eq('status', 'pending');

  if (error) throw error;
  return count ?? 0;
}

export async function fetchFriendships(): Promise<Friendship[]> {
  const me = await getCurrentUserId();
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as FriendshipRow[];
  const otherIds = rows.map((row) =>
    row.requester_id === me ? row.addressee_id : row.requester_id,
  );
  const profiles = await fetchProfiles([...new Set(otherIds)]);

  return rows.map((row) => mapFriendship(row, me, profiles));
}

export async function fetchAcceptedFriends(): Promise<FriendshipOtherUser[]> {
  const friendships = await fetchFriendships();
  return friendships.filter((f) => f.status === 'accepted').map((f) => f.otherUser);
}

export async function sendFriendRequest(email: string): Promise<void> {
  const { error } = await supabase.rpc('send_friend_request', { target_email: email.trim() });
  if (error) throw error;
}

export async function respondToRequest(friendshipId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_friend_request', {
    friendship_id: friendshipId,
    accept,
  });
  if (error) throw error;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { friendship_id: friendshipId });
  if (error) throw error;
}

export async function fetchFriendEntries(userId: string): Promise<TimeEntry[]> {
  return fetchAllEntries(userId);
}

export async function fetchFriendGeofences(userId: string): Promise<Geofence[]> {
  return fetchGeofences(userId);
}
