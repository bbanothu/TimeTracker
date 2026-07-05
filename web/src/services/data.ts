import { DEFAULT_TAGS } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import {
  applyTagAnalyticsPrefs,
  clearTagAnalyticsPref,
  saveTagAnalyticsPref,
} from '@/lib/tagAnalyticsPrefs';
import type { ActiveSession, EntrySource, Geofence, Tag, TagDailyGoal, TimeEntry } from '@/types';
import type { MergedEntryFields } from '@/utils/entryMerge';
import { buildAggregatedExportCsv } from '@/utils/aggregatedExportCsv';

const SESSION_KEY = 'timetracker-active-sessions';
const LEGACY_SESSION_KEY = 'timetracker-active-session';

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
  ended_at: number | null;
  source: EntrySource;
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

const TAG_COLUMNS = 'id, name, color, parent_id, include_in_analytics, description';
const TAG_COLUMNS_LEGACY = 'id, name, color, parent_id';
const NESTED_TAG_COLUMNS = 'id, name, color, parent_id, include_in_analytics, description';
const NESTED_TAG_COLUMNS_LEGACY = 'id, name, color, parent_id';

function isMissingTagColumn(
  error: { code?: string; message?: string } | null,
  column: string,
): boolean {
  if (!error) return false;
  return (
    error.code === '42703' || (typeof error.message === 'string' && error.message.includes(column))
  );
}

function isMissingAnalyticsColumn(error: { code?: string; message?: string } | null): boolean {
  return isMissingTagColumn(error, 'include_in_analytics');
}

function isMissingStopDetailsColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('stop_latitude'))
  );
}

const ENTRY_SELECT_COLUMNS =
  'id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details';
const ENTRY_SELECT_COLUMNS_LEGACY = 'id, started_at, ended_at, source, geofence_id';

function isMissingDescriptionColumn(error: { code?: string; message?: string } | null): boolean {
  return isMissingTagColumn(error, 'description');
}

function mapTag(row: TagRow): Tag {
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
    .filter((tag): tag is Tag => tag !== null);

  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    source: row.source,
    geofenceId: row.geofence_id,
    stopLatitude: row.stop_latitude ?? null,
    stopLongitude: row.stop_longitude ?? null,
    details: row.details?.trim() ? row.details.trim() : null,
    tags,
  };
}

function mapActiveSession(entry: TimeEntry): ActiveSession {
  return {
    id: entry.id,
    startedAt: entry.startedAt,
    source: entry.source,
    geofenceId: entry.geofenceId,
    tagIds: entry.tags.map((tag) => tag.id),
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

export async function fetchTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_COLUMNS)
    .eq('user_id', userId)
    .order('name');

  if (isMissingDescriptionColumn(error)) {
    const fallback = await supabase
      .from('tags')
      .select('id, name, color, parent_id, include_in_analytics')
      .eq('user_id', userId)
      .order('name');
    if (fallback.error) throw fallback.error;
    return applyTagAnalyticsPrefs(userId, (fallback.data ?? []).map(mapTag));
  }

  if (isMissingAnalyticsColumn(error)) {
    const fallback = await supabase
      .from('tags')
      .select(TAG_COLUMNS_LEGACY)
      .eq('user_id', userId)
      .order('name');
    if (fallback.error) throw fallback.error;
    return applyTagAnalyticsPrefs(userId, (fallback.data ?? []).map(mapTag));
  }

  if (error) throw error;
  return applyTagAnalyticsPrefs(userId, (data ?? []).map(mapTag));
}

export async function seedDefaultTags(userId: string): Promise<void> {
  const existing = await fetchTags(userId);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const rows = DEFAULT_TAGS.map((tag) => ({
    user_id: userId,
    name: tag.name,
    color: tag.color,
    parent_id: null,
    include_in_analytics: true,
    updated_at: now,
  }));

  let { error } = await supabase.from('tags').insert(rows);
  if (isMissingAnalyticsColumn(error)) {
    const legacyRows = DEFAULT_TAGS.map((tag) => ({
      user_id: userId,
      name: tag.name,
      color: tag.color,
      parent_id: null,
      updated_at: now,
    }));
    ({ error } = await supabase.from('tags').insert(legacyRows));
  }
  if (error) throw error;
}

export async function createTag(
  userId: string,
  name: string,
  color: string,
  parentId: string | null,
  description: string | null = null,
): Promise<Tag> {
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');
  const normalizedDescription = description?.trim() ? description.trim() : null;

  let { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      name: normalized,
      color,
      parent_id: parentId,
      include_in_analytics: true,
      description: normalizedDescription,
      updated_at: new Date().toISOString(),
    })
    .select(TAG_COLUMNS)
    .single();

  if (isMissingDescriptionColumn(error)) {
    ({ data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: normalized,
        color,
        parent_id: parentId,
        include_in_analytics: true,
        updated_at: new Date().toISOString(),
      })
      .select('id, name, color, parent_id, include_in_analytics')
      .single());
  }

  if (isMissingAnalyticsColumn(error)) {
    ({ data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: normalized,
        color,
        parent_id: parentId,
        updated_at: new Date().toISOString(),
      })
      .select(TAG_COLUMNS_LEGACY)
      .single());
  }

  if (error) throw error;
  if (!data) throw new Error('Tag could not be created');
  return mapTag(data);
}

export async function setTagIncludeInAnalytics(
  userId: string,
  id: string,
  includeInAnalytics: boolean,
): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .update({
      include_in_analytics: includeInAnalytics,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(TAG_COLUMNS)
    .single();

  if (isMissingAnalyticsColumn(error)) {
    saveTagAnalyticsPref(userId, id, includeInAnalytics);
    const fallback = await supabase
      .from('tags')
      .select(TAG_COLUMNS_LEGACY)
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fallback.error) throw fallback.error;
    if (!fallback.data) throw new Error('Tag not found');
    return { ...mapTag(fallback.data), includeInAnalytics };
  }

  if (error) throw error;
  if (!data) throw new Error('Tag not found');
  clearTagAnalyticsPref(userId, id);
  return mapTag(data);
}

export async function updateTag(
  userId: string,
  id: string,
  name: string,
  color: string,
  parentId: string | null,
  description?: string | null,
): Promise<Tag> {
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');
  const normalizedDescription =
    description === undefined ? undefined : description?.trim() ? description.trim() : null;

  const updatePayload: Record<string, unknown> = {
    name: normalized,
    color,
    parent_id: parentId,
    updated_at: new Date().toISOString(),
  };
  if (normalizedDescription !== undefined) {
    updatePayload.description = normalizedDescription;
  }

  let { data, error } = await supabase
    .from('tags')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(TAG_COLUMNS)
    .single();

  if (isMissingDescriptionColumn(error)) {
    const { description: _ignored, ...legacyPayload } = updatePayload;
    ({ data, error } = await supabase
      .from('tags')
      .update(legacyPayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, color, parent_id, include_in_analytics')
      .single());
  }

  if (isMissingAnalyticsColumn(error)) {
    const { include_in_analytics: _ignored, description: _desc, ...legacyPayload } = updatePayload;
    ({ data, error } = await supabase
      .from('tags')
      .update(legacyPayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(TAG_COLUMNS_LEGACY)
      .single());
  }

  if (error) throw error;
  if (!data) throw new Error('Tag could not be updated');
  return mapTag(data);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

type GoalRow = {
  id: string;
  tag_id: string;
  target_minutes: number;
};

function mapGoal(row: GoalRow): TagDailyGoal {
  return {
    id: row.id,
    tagId: row.tag_id,
    targetMinutes: row.target_minutes,
  };
}

export async function fetchGoals(userId: string): Promise<TagDailyGoal[]> {
  const { data, error } = await supabase
    .from('tag_daily_goals')
    .select('id, tag_id, target_minutes')
    .eq('user_id', userId)
    .order('tag_id');

  if (error) throw error;
  return (data ?? []).map(mapGoal);
}

export async function upsertGoal(
  userId: string,
  tagId: string,
  targetMinutes: number,
): Promise<TagDailyGoal> {
  if (!Number.isInteger(targetMinutes) || targetMinutes < 0 || targetMinutes > 1440) {
    throw new Error('Target must be between 0 and 1440 minutes');
  }

  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id, parent_id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .maybeSingle();

  if (tagError) throw tagError;
  if (!tag) throw new Error('Tag not found');
  if (tag.parent_id !== null) throw new Error('Goals can only be set on top-level categories');

  const { data, error } = await supabase
    .from('tag_daily_goals')
    .upsert(
      {
        user_id: userId,
        tag_id: tagId,
        target_minutes: targetMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,tag_id' },
    )
    .select('id, tag_id, target_minutes');

  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Goal could not be saved');
  return mapGoal(row);
}

export async function deleteGoal(userId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('tag_daily_goals')
    .delete()
    .eq('user_id', userId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

async function fetchEntriesWithSelect(
  userId: string,
  nestedTagSelect: string,
  filters?: { startMs: number; endMs: number },
): Promise<TimeEntry[]> {
  let query = supabase
    .from('time_entries')
    .select(
      `${ENTRY_SELECT_COLUMNS},
       time_entry_tags(tag_id, tags(${nestedTagSelect}))`,
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  if (filters) {
    query = query.gt('ended_at', filters.startMs).lt('started_at', filters.endMs);
  }

  const { data, error } = await query.order('started_at', { ascending: false });
  if (!isMissingAnalyticsColumn(error) && !isMissingStopDetailsColumn(error)) {
    if (error) throw error;
    return (data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
  }

  if (isMissingStopDetailsColumn(error)) {
    let legacyStopQuery = supabase
      .from('time_entries')
      .select(
        `${ENTRY_SELECT_COLUMNS_LEGACY},
         time_entry_tags(tag_id, tags(${nestedTagSelect}))`,
      )
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    if (filters) {
      legacyStopQuery = legacyStopQuery
        .gt('ended_at', filters.startMs)
        .lt('started_at', filters.endMs);
    }

    const stopFallback = await legacyStopQuery.order('started_at', { ascending: false });
    if (stopFallback.error) throw stopFallback.error;
    return (stopFallback.data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
  }

  let legacyQuery = supabase
    .from('time_entries')
    .select(
      `${ENTRY_SELECT_COLUMNS_LEGACY},
       time_entry_tags(tag_id, tags(${NESTED_TAG_COLUMNS_LEGACY}))`,
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  if (filters) {
    legacyQuery = legacyQuery.gt('ended_at', filters.startMs).lt('started_at', filters.endMs);
  }

  const fallback = await legacyQuery.order('started_at', { ascending: false });
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
}

export async function fetchActiveSessions(userId: string): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select(
      `${ENTRY_SELECT_COLUMNS},
       time_entry_tags(tag_id, tags(${NESTED_TAG_COLUMNS}))`,
    )
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapActiveSession(mapEntry(row as unknown as EntryRow)));
}

export async function startActiveEntry(
  userId: string,
  input: {
    source: EntrySource;
    geofenceId?: string | null;
    tagIds: string[];
    startedAt?: number;
  },
): Promise<string> {
  if (input.tagIds.length === 0) throw new Error('Select at least one tag');

  const startedAt = input.startedAt ?? Date.now();
  const { data: entry, error: entryError } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      started_at: startedAt,
      ended_at: null,
      source: input.source,
      geofence_id: input.geofenceId ?? null,
      stop_latitude: null,
      stop_longitude: null,
      details: null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (entryError) throw entryError;

  const { error: linkError } = await supabase.from('time_entry_tags').insert(
    input.tagIds.map((tagId) => ({
      entry_id: entry.id,
      tag_id: tagId,
      user_id: userId,
    })),
  );
  if (linkError) throw linkError;

  return entry.id;
}

export async function completeTimeEntry(
  userId: string,
  entryId: string,
  input: {
    endedAt: number;
    stopLatitude?: number | null;
    stopLongitude?: number | null;
    details?: string | null;
  },
): Promise<void> {
  const details = input.details?.trim() ? input.details.trim() : null;
  const { error } = await supabase
    .from('time_entries')
    .update({
      ended_at: input.endedAt,
      stop_latitude: input.stopLatitude ?? null,
      stop_longitude: input.stopLongitude ?? null,
      details,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .is('ended_at', null);

  if (error) throw error;
}

export async function fetchEntries(
  userId: string,
  startMs: number,
  endMs: number,
): Promise<TimeEntry[]> {
  return fetchEntriesWithSelect(userId, NESTED_TAG_COLUMNS, { startMs, endMs });
}

export async function fetchAllEntries(userId: string): Promise<TimeEntry[]> {
  return fetchEntriesWithSelect(userId, NESTED_TAG_COLUMNS);
}

export async function createTimeEntry(
  userId: string,
  input: {
    startedAt: number;
    endedAt: number;
    source: EntrySource;
    geofenceId?: string | null;
    tagIds: string[];
    stopLatitude?: number | null;
    stopLongitude?: number | null;
    details?: string | null;
  },
): Promise<string> {
  const details = input.details?.trim() ? input.details.trim() : null;
  const { data: entry, error: entryError } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      source: input.source,
      geofence_id: input.geofenceId ?? null,
      stop_latitude: input.stopLatitude ?? null,
      stop_longitude: input.stopLongitude ?? null,
      details,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (entryError) throw entryError;

  if (input.tagIds.length > 0) {
    const { error: linkError } = await supabase.from('time_entry_tags').insert(
      input.tagIds.map((tagId) => ({
        entry_id: entry.id,
        tag_id: tagId,
        user_id: userId,
      })),
    );
    if (linkError) throw linkError;
  }

  return entry.id;
}

export async function updateTimeEntryStopDetails(
  userId: string,
  entryId: string,
  input: {
    details?: string | null;
    stopLatitude?: number | null;
    stopLongitude?: number | null;
  },
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.details !== undefined) {
    payload.details = input.details?.trim() ? input.details.trim() : null;
  }
  if (input.stopLatitude !== undefined) payload.stop_latitude = input.stopLatitude;
  if (input.stopLongitude !== undefined) payload.stop_longitude = input.stopLongitude;

  const { error } = await supabase
    .from('time_entries')
    .update(payload)
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteTimeEntry(userId: string, entryId: string): Promise<void> {
  const { error: tagsError } = await supabase
    .from('time_entry_tags')
    .delete()
    .eq('entry_id', entryId)
    .eq('user_id', userId);
  if (tagsError) throw tagsError;

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function mergeTimeEntries(
  userId: string,
  keepEntryId: string,
  deleteEntryId: string,
  tagIds: string[],
  fields: MergedEntryFields,
): Promise<void> {
  await updateTimeEntry(userId, keepEntryId, {
    startedAt: fields.startedAt,
    endedAt: fields.endedAt,
    tagIds,
    details: fields.details,
  });
  await updateTimeEntryStopDetails(userId, keepEntryId, {
    stopLatitude: fields.stopLatitude,
    stopLongitude: fields.stopLongitude,
  });
  await deleteTimeEntry(userId, deleteEntryId);
}

export async function updateTimeEntry(
  userId: string,
  entryId: string,
  input: {
    startedAt: number;
    endedAt: number;
    tagIds: string[];
    details?: string | null;
  },
): Promise<void> {
  if (input.tagIds.length === 0) throw new Error('Select at least one tag');
  if (input.endedAt <= input.startedAt) throw new Error('End must be after start');
  if (input.endedAt > Date.now()) throw new Error('End cannot be in the future');

  const payload: Record<string, unknown> = {
    started_at: input.startedAt,
    ended_at: input.endedAt,
    updated_at: new Date().toISOString(),
  };
  if (input.details !== undefined) {
    payload.details = input.details?.trim() ? input.details.trim() : null;
  }

  const { error: entryError } = await supabase
    .from('time_entries')
    .update(payload)
    .eq('id', entryId)
    .eq('user_id', userId)
    .not('ended_at', 'is', null);
  if (entryError) throw entryError;

  const { error: deleteTagsError } = await supabase
    .from('time_entry_tags')
    .delete()
    .eq('entry_id', entryId)
    .eq('user_id', userId);
  if (deleteTagsError) throw deleteTagsError;

  if (input.tagIds.length > 0) {
    const { error: linkError } = await supabase.from('time_entry_tags').insert(
      input.tagIds.map((tagId) => ({
        entry_id: entryId,
        tag_id: tagId,
        user_id: userId,
      })),
    );
    if (linkError) throw linkError;
  }
}

export async function deleteAllEntries(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('time_entries')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

export async function fetchGeofences(userId: string): Promise<Geofence[]> {
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

export async function createGeofence(
  userId: string,
  input: {
    tagId: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  },
): Promise<Geofence> {
  const name = input.name.trim();
  if (!name) throw new Error('Place name is required');

  const radiusMeters = Math.max(25, Math.round(input.radiusMeters) || 150);
  const payload = {
    user_id: userId,
    tag_id: input.tagId,
    name,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_meters: radiusMeters,
    enabled: true,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('geofences')
    .insert(payload)
    .select(
      `id, tag_id, name, latitude, longitude, radius_meters, enabled, tags(${NESTED_TAG_COLUMNS})`,
    )
    .single();

  if (isMissingAnalyticsColumn(error)) {
    ({ data, error } = await supabase
      .from('geofences')
      .insert(payload)
      .select(
        `id, tag_id, name, latitude, longitude, radius_meters, enabled, tags(${NESTED_TAG_COLUMNS_LEGACY})`,
      )
      .single());
  }

  if (error) throw error;
  if (!data) throw new Error('Place could not be saved');
  return mapGeofence(data as unknown as GeofenceRow);
}

export async function updateGeofence(
  userId: string,
  id: string,
  patch: Partial<
    Pick<Geofence, 'enabled' | 'name' | 'radiusMeters' | 'tagId' | 'latitude' | 'longitude'>
  >,
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.enabled !== undefined) payload.enabled = patch.enabled;
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.radiusMeters !== undefined)
    payload.radius_meters = Math.max(25, Math.round(patch.radiusMeters));
  if (patch.tagId !== undefined) payload.tag_id = patch.tagId;
  if (patch.latitude !== undefined) payload.latitude = patch.latitude;
  if (patch.longitude !== undefined) payload.longitude = patch.longitude;

  const { error } = await supabase
    .from('geofences')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteGeofence(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('geofences').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export function loadActiveSessions(): ActiveSession[] {
  // Legacy local-only sessions; cloud-backed active entries replaced this.
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore
  }
  return [];
}

export function saveActiveSessions(_sessions: ActiveSession[]): void {
  // No-op: active sessions live in Supabase as time_entries with ended_at IS NULL.
}

export function exportEntriesCsv(entries: TimeEntry[], tags: Tag[], personName: string): string {
  return buildAggregatedExportCsv(entries, tags, personName);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
