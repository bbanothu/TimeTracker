import NetInfo from '@react-native-community/netinfo';

import {
  deleteGeofenceLocally,
  deleteTagLocally,
  getLastPulledAt,
  getSyncQueue,
  removeSyncQueueItem,
  setLastPulledAt,
  upsertEntryFromRemote,
  upsertGeofenceFromRemote,
  upsertTagFromRemote,
} from '@/db/client';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { EntrySource } from '@/types';

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

export async function push(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await isOnline())) return;

  const queue = getSyncQueue();

  for (const item of queue) {
    try {
      if (item.entityType === 'tag') {
        if (item.operation === 'delete') {
          const { error } = await supabase.from('tags').delete().eq('id', item.entityId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tags').upsert(item.payload);
          if (error) throw error;
        }
      } else if (item.entityType === 'entry') {
        if (item.operation === 'delete') {
          await supabase.from('time_entry_tags').delete().eq('entry_id', item.entityId);
          const { error } = await supabase.from('time_entries').delete().eq('id', item.entityId);
          if (error) throw error;
        } else {
          const payload = item.payload as {
            id: string;
            user_id: string;
            started_at: number;
            ended_at: number;
            source: EntrySource;
            geofence_id: string | null;
            updated_at: string;
            tag_ids: string[];
          };
          const { error: entryError } = await supabase.from('time_entries').upsert({
            id: payload.id,
            user_id: payload.user_id,
            started_at: payload.started_at,
            ended_at: payload.ended_at,
            source: payload.source,
            geofence_id: payload.geofence_id,
            updated_at: payload.updated_at,
          });
          if (entryError) throw entryError;

          await supabase.from('time_entry_tags').delete().eq('entry_id', payload.id);
          if (payload.tag_ids.length > 0) {
            const { error: tagsError } = await supabase.from('time_entry_tags').insert(
              payload.tag_ids.map((tagId) => ({
                entry_id: payload.id,
                tag_id: tagId,
                user_id: userId,
              })),
            );
            if (tagsError) throw tagsError;
          }
        }
      } else if (item.entityType === 'geofence') {
        if (item.operation === 'delete') {
          const { error } = await supabase.from('geofences').delete().eq('id', item.entityId);
          if (error) throw error;
        } else {
          const payload = item.payload as {
            enabled: boolean;
            [key: string]: unknown;
          };
          const { error } = await supabase.from('geofences').upsert({
            ...payload,
            enabled: payload.enabled,
          });
          if (error) throw error;
        }
      }

      removeSyncQueueItem(item.id);
    } catch (error) {
      console.warn('Sync push failed for', item.entityType, item.entityId, error);
      break;
    }
  }
}

export async function pull(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await isOnline())) return;

  const lastPulledAt = getLastPulledAt();
  const sinceIso = new Date(lastPulledAt).toISOString();

  const [tagsResult, entriesResult, geofencesResult] = await Promise.all([
    supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso)
      .order('updated_at', { ascending: true }),
    supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso)
      .order('updated_at', { ascending: true }),
    supabase
      .from('geofences')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso)
      .order('updated_at', { ascending: true }),
  ]);

  if (tagsResult.error) throw tagsResult.error;
  if (entriesResult.error) throw entriesResult.error;
  if (geofencesResult.error) throw geofencesResult.error;

  const pendingTags = [...(tagsResult.data ?? [])];
  const upsertedTagIds = new Set<string>();
  while (pendingTags.length > 0) {
    const batch = pendingTags.filter(
      (tag) => !tag.parent_id || upsertedTagIds.has(tag.parent_id),
    );
    if (batch.length === 0) {
      for (const tag of pendingTags) {
        upsertTagFromRemote(tag);
      }
      break;
    }
    for (const tag of batch) {
      upsertTagFromRemote(tag);
      upsertedTagIds.add(tag.id);
    }
    const remaining = pendingTags.filter((t) => !upsertedTagIds.has(t.id));
    pendingTags.splice(0, pendingTags.length, ...remaining);
  }

  for (const entry of entriesResult.data ?? []) {
    const { data: tagLinks } = await supabase
      .from('time_entry_tags')
      .select('tag_id')
      .eq('entry_id', entry.id);

    upsertEntryFromRemote({
      ...entry,
      tag_ids: (tagLinks ?? []).map((link) => link.tag_id),
    });
  }

  for (const geofence of geofencesResult.data ?? []) {
    upsertGeofenceFromRemote({
      ...geofence,
      enabled: Boolean(geofence.enabled),
    });
  }

  setLastPulledAt(Date.now());
}

export async function sync(userId: string): Promise<void> {
  await push(userId);
  await pull(userId);
}

export async function seedRemoteDefaultsIfEmpty(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await isOnline())) return;

  const { count, error } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  if ((count ?? 0) > 0) return;

  await push(userId);
}

export const syncService = { push, pull, sync, seedRemoteDefaultsIfEmpty };
