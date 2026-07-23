import { supabase } from '@/lib/supabase';
import { buildProfileDisplayName } from '@/services/profileService';
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

type TagRow = {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  include_in_analytics?: boolean | null;
  description?: string | null;
};

type EntryRow = {
  id: string;
  started_at: number;
  ended_at: number;
  source: 'manual' | 'geofence';
  geofence_id: string | null;
  stop_latitude?: number | null;
  stop_longitude?: number | null;
  details?: string | null;
  time_entry_tags: Array<{ tag_id: string; tags: TagRow | null }>;
};

type GeofenceRow = {
  id: string;
  tag_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  enabled: boolean;
  tags: TagRow | null;
};

const NESTED_TAG_COLUMNS = 'id, name, color, parent_id, include_in_analytics, description';
const NESTED_TAG_COLUMNS_LEGACY = 'id, name, color, parent_id';

function mapTag(row: TagRow) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id,
    includeInAnalytics: row.include_in_analytics !== false,
    description: row.description?.trim() ? row.description.trim() : null,
  };
}

function mapEntry(row: EntryRow): TimeEntry {
  const tags = (row.time_entry_tags ?? [])
    .map((link) => (link.tags ? mapTag(link.tags) : null))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== null);

  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    source: row.source,
    geofenceId: row.geofence_id,
    stopLatitude: row.stop_latitude ?? null,
    stopLongitude: row.stop_longitude ?? null,
    details: row.details?.trim() ? row.details.trim() : null,
    alarmAt: null,
    tags,
  };
}

function mapGeofence(row: GeofenceRow): Geofence {
  return {
    id: row.id,
    tagId: row.tag_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius_meters,
    enabled: row.enabled,
    tag: row.tags ? mapTag(row.tags) : undefined,
  };
}

function isMissingAnalyticsColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('include_in_analytics'))
  );
}

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
  const { data, error } = await supabase
    .from('time_entries')
    .select(
      `id, started_at, ended_at, source, geofence_id,
       time_entry_tags(tag_id, tags(${NESTED_TAG_COLUMNS}))`,
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (!isMissingAnalyticsColumn(error)) {
    if (error) throw error;
    return (data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
  }

  const fallback = await supabase
    .from('time_entries')
    .select(
      `id, started_at, ended_at, source, geofence_id,
       time_entry_tags(tag_id, tags(${NESTED_TAG_COLUMNS_LEGACY}))`,
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
}

export async function fetchFriendGeofences(userId: string): Promise<Geofence[]> {
  const { data, error } = await supabase
    .from('geofences')
    .select(
      `id, tag_id, name, latitude, longitude, radius_meters, enabled, tags(${NESTED_TAG_COLUMNS})`,
    )
    .eq('user_id', userId)
    .order('name');

  if (isMissingAnalyticsColumn(error)) {
    const fallback = await supabase
      .from('geofences')
      .select(
        `id, tag_id, name, latitude, longitude, radius_meters, enabled, tags(${NESTED_TAG_COLUMNS_LEGACY})`,
      )
      .eq('user_id', userId)
      .order('name');
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map((row) => mapGeofence(row as unknown as GeofenceRow));
  }

  if (error) throw error;
  return (data ?? []).map((row) => mapGeofence(row as unknown as GeofenceRow));
}
