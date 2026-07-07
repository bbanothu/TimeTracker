import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import {
  getAllTags,
  getLastPulledAt,
  getSyncQueue,
  hasPendingSyncOperation,
  remapLocalTagId,
  removeSyncQueueItem,
  setLastPulledAt,
  upsertDailyGoalScoreFromRemote,
  upsertEntryFromRemote,
  upsertGeofenceFromRemote,
  upsertGoalFromRemote,
  upsertTagFromRemote,
} from '@/db/client';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { EntrySource } from '@/types';

async function reconcileTagPushConflict(payload: Record<string, unknown>): Promise<void> {
  const userId = payload.user_id as string;
  const localId = payload.id as string;
  const name = payload.name as string;
  const parentId = (payload.parent_id as string | null | undefined) ?? null;

  let query = supabase.from('tags').select('*').eq('user_id', userId).eq('name', name);
  query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);

  const { data: remoteTag, error: fetchError } = await query.maybeSingle();
  if (fetchError) throw fetchError;
  if (!remoteTag) {
    throw new Error(`Tag "${name}" already exists remotely but could not be loaded`);
  }

  if (remoteTag.id !== localId) {
    remapLocalTagId(localId, remoteTag.id as string);
  }

  upsertTagFromRemote({
    id: remoteTag.id as string,
    user_id: remoteTag.user_id as string,
    name: remoteTag.name as string,
    color: remoteTag.color as string,
    parent_id: (remoteTag.parent_id as string | null | undefined) ?? null,
    include_in_analytics: remoteTag.include_in_analytics as boolean | null | undefined,
    description: (remoteTag.description as string | null | undefined) ?? null,
    updated_at: remoteTag.updated_at as string,
  });
}

async function upsertTagToRemote(payload: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase.from('tags').upsert(payload);
  if (
    error?.code === 'PGRST204' &&
    typeof error.message === 'string' &&
    (error.message.includes('include_in_analytics') || error.message.includes('description'))
  ) {
    const {
      include_in_analytics: _ignoredAnalytics,
      description: _ignoredDescription,
      updated_at: _updatedAt,
      ...rest
    } = payload;
    if (Object.keys(rest).length > 0) {
      const { error: retryError } = await supabase.from('tags').upsert(rest);
      if (retryError?.code === '23505') {
        await reconcileTagPushConflict(payload);
        return true;
      }
      if (retryError) throw retryError;
    }
    return false;
  }
  if (error?.code === '23505' || error?.message?.includes('idx_tags_user_parent_name')) {
    await reconcileTagPushConflict(payload);
    return true;
  }
  if (error) throw error;
  return true;
}

async function ensureTagExistsForGoal(userId: string, tagId: string): Promise<void> {
  const tag = getAllTags().find((item) => item.id === tagId);
  if (!tag) return;

  await upsertTagToRemote({
    id: tag.id,
    user_id: userId,
    name: tag.name,
    color: tag.color,
    parent_id: tag.parentId,
    include_in_analytics: tag.includeInAnalytics,
    description: tag.description,
    updated_at: new Date().toISOString(),
  });
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected !== true) return false;
  if (Platform.OS === 'android') {
    // Android often reports isInternetReachable=false while the device is online.
    return true;
  }
  return state.isInternetReachable !== false;
}

export async function waitForNetwork(maxAttempts = 8, delayMs = 500): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isOnline()) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return isOnline();
}

export type SyncOptions = {
  fullPull?: boolean;
};

export type SyncResult = {
  pushed: boolean;
  pulled: boolean;
  skippedReason?: 'offline' | 'not_configured';
};

function remoteUpdatedAtMs(value: string): number {
  return new Date(value).getTime();
}

let operationChain: Promise<unknown> = Promise.resolve();

async function withSyncLock<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationChain.then(operation, operation);
  operationChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function pushInternal(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (!(await isOnline())) return false;

  const queue = getSyncQueue();
  let progressed = false;

  for (const item of queue) {
    try {
      if (item.entityType === 'tag') {
        if (item.operation === 'delete') {
          const { error } = await supabase.from('tags').delete().eq('id', item.entityId);
          if (error) throw error;
        } else {
          const fullySynced = await upsertTagToRemote(item.payload);
          if (!fullySynced) {
            continue;
          }
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
            ended_at: number | null;
            source: EntrySource;
            geofence_id: string | null;
            stop_latitude?: number | null;
            stop_longitude?: number | null;
            details?: string | null;
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
            stop_latitude: payload.stop_latitude ?? null,
            stop_longitude: payload.stop_longitude ?? null,
            details: payload.details ?? null,
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
      } else if (item.entityType === 'goal') {
        if (item.operation === 'delete') {
          const { error } = await supabase.from('tag_daily_goals').delete().eq('id', item.entityId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tag_daily_goals').upsert(item.payload, {
            onConflict: 'user_id,tag_id',
          });
          if (error) throw error;
        }
      } else if (item.entityType === 'daily_score') {
        if (item.operation === 'delete') {
          const { error } = await supabase
            .from('daily_goal_scores')
            .delete()
            .eq('id', item.entityId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('daily_goal_scores').upsert(item.payload);
          if (error) throw error;
        }
      }

      removeSyncQueueItem(item.id);
      progressed = true;
    } catch (error) {
      console.warn('Sync push failed for', item.entityType, item.entityId, error);
    }
  }

  return progressed || getSyncQueue().length === 0;
}

export async function pushGoalForTag(userId: string, tagId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await isOnline())) {
    throw new Error('No internet connection');
  }

  await ensureTagExistsForGoal(userId, tagId);

  const pending = getSyncQueue().filter(
    (item) => item.entityType === 'goal' && item.payload.tag_id === tagId,
  );

  for (const item of pending) {
    if (item.operation === 'delete') {
      const { error } = await supabase.from('tag_daily_goals').delete().eq('id', item.entityId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('tag_daily_goals').upsert(item.payload, {
        onConflict: 'user_id,tag_id',
      });
      if (error) throw new Error(error.message);
    }
    removeSyncQueueItem(item.id);
  }
}

async function pullInternal(userId: string, options: SyncOptions = {}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (!(await isOnline())) return false;

  const lastPulledAt = getLastPulledAt();
  const sinceIso = options.fullPull
    ? new Date(0).toISOString()
    : new Date(Math.max(0, lastPulledAt - 5000)).toISOString();

  const [tagsResult, entriesResult, geofencesResult, goalsResult, scoresResult] = await Promise.all(
    [
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
      supabase
        .from('tag_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', sinceIso)
        .order('updated_at', { ascending: true }),
      supabase
        .from('daily_goal_scores')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', sinceIso)
        .order('updated_at', { ascending: true }),
    ],
  );

  if (tagsResult.error) throw tagsResult.error;
  if (entriesResult.error) throw entriesResult.error;
  if (geofencesResult.error) throw geofencesResult.error;
  if (goalsResult.error) {
    console.warn('Goals sync unavailable:', goalsResult.error.message);
  }
  if (scoresResult.error) {
    console.warn('Daily goal scores sync unavailable:', scoresResult.error.message);
  }

  let maxRemoteUpdatedAt = lastPulledAt;
  const bumpCursor = (updatedAt: string) => {
    maxRemoteUpdatedAt = Math.max(maxRemoteUpdatedAt, remoteUpdatedAtMs(updatedAt));
  };

  const pendingTags = [...(tagsResult.data ?? [])];
  const upsertedTagIds = new Set<string>();
  while (pendingTags.length > 0) {
    const batch = pendingTags.filter((tag) => !tag.parent_id || upsertedTagIds.has(tag.parent_id));
    if (batch.length === 0) {
      for (const tag of pendingTags) {
        bumpCursor(tag.updated_at);
        upsertTagFromRemote(tag);
      }
      break;
    }
    for (const tag of batch) {
      bumpCursor(tag.updated_at);
      upsertTagFromRemote(tag);
      upsertedTagIds.add(tag.id);
    }
    const remaining = pendingTags.filter((t) => !upsertedTagIds.has(t.id));
    pendingTags.splice(0, pendingTags.length, ...remaining);
  }

  for (const entry of entriesResult.data ?? []) {
    if (hasPendingSyncOperation('entry', entry.id as string, 'delete')) {
      continue;
    }

    bumpCursor(entry.updated_at);
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
    bumpCursor(geofence.updated_at);
    upsertGeofenceFromRemote({
      ...geofence,
      enabled: Boolean(geofence.enabled),
    });
  }

  if (!goalsResult.error) {
    for (const goal of goalsResult.data ?? []) {
      bumpCursor(goal.updated_at);
      upsertGoalFromRemote(goal);
    }
  }

  if (!scoresResult.error) {
    for (const score of scoresResult.data ?? []) {
      bumpCursor(score.updated_at);
      upsertDailyGoalScoreFromRemote(score);
    }
  }

  const pulledCount =
    (tagsResult.data?.length ?? 0) +
    (entriesResult.data?.length ?? 0) +
    (geofencesResult.data?.length ?? 0) +
    (goalsResult.error ? 0 : (goalsResult.data?.length ?? 0)) +
    (scoresResult.error ? 0 : (scoresResult.data?.length ?? 0));

  if (pulledCount > 0 || options.fullPull) {
    setLastPulledAt(maxRemoteUpdatedAt);
  }

  return true;
}

export async function push(userId: string): Promise<boolean> {
  return withSyncLock(() => pushInternal(userId));
}

export async function pull(userId: string, options: SyncOptions = {}): Promise<boolean> {
  return withSyncLock(() => pullInternal(userId, options));
}

export async function sync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
  return withSyncLock(async () => {
    if (!isSupabaseConfigured) {
      return { pushed: false, pulled: false, skippedReason: 'not_configured' };
    }
    if (!(await isOnline())) {
      return { pushed: false, pulled: false, skippedReason: 'offline' };
    }

    const pushed = await pushInternal(userId);
    const pulled = await pullInternal(userId, options);
    return { pushed, pulled };
  });
}

export async function uploadToCloud(userId: string): Promise<SyncResult> {
  return withSyncLock(async () => {
    if (!isSupabaseConfigured) {
      return { pushed: false, pulled: false, skippedReason: 'not_configured' };
    }
    if (!(await isOnline())) {
      return { pushed: false, pulled: false, skippedReason: 'offline' };
    }

    const pushed = await pushInternal(userId);
    return { pushed, pulled: false };
  });
}

export const syncService = { push, pull, sync, uploadToCloud, pushGoalForTag };
