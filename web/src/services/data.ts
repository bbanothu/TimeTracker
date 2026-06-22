import { DEFAULT_TAGS } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import type { ActiveSession, EntrySource, Geofence, Tag, TagDailyGoal, TimeEntry } from '@/types';

const SESSION_KEY = 'timetracker-active-sessions';
const LEGACY_SESSION_KEY = 'timetracker-active-session';

type TagRow = {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  include_in_analytics?: boolean | null;
};

type EntryRow = {
  id: string;
  started_at: number;
  ended_at: number;
  source: EntrySource;
  geofence_id: string | null;
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

const TAG_COLUMNS = 'id, name, color, parent_id, include_in_analytics';
const TAG_COLUMNS_LEGACY = 'id, name, color, parent_id';
const NESTED_TAG_COLUMNS = 'id, name, color, parent_id, include_in_analytics';
const NESTED_TAG_COLUMNS_LEGACY = 'id, name, color, parent_id';

function isMissingAnalyticsColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.includes('include_in_analytics'))
  );
}

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id,
    includeInAnalytics: row.include_in_analytics !== false,
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

export async function fetchTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_COLUMNS)
    .eq('user_id', userId)
    .order('name');

  if (isMissingAnalyticsColumn(error)) {
    const fallback = await supabase
      .from('tags')
      .select(TAG_COLUMNS_LEGACY)
      .eq('user_id', userId)
      .order('name');
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map(mapTag);
  }

  if (error) throw error;
  return (data ?? []).map(mapTag);
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
): Promise<Tag> {
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');

  let { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      name: normalized,
      color,
      parent_id: parentId,
      include_in_analytics: true,
      updated_at: new Date().toISOString(),
    })
    .select(TAG_COLUMNS)
    .single();

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
    const fallback = await supabase
      .from('tags')
      .select(TAG_COLUMNS_LEGACY)
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fallback.error) throw fallback.error;
    if (!fallback.data) throw new Error('Tag not found');
    return mapTag(fallback.data);
  }

  if (error) throw error;
  if (!data) throw new Error('Tag not found');
  return mapTag(data);
}

export async function updateTag(
  userId: string,
  id: string,
  name: string,
  color: string,
  parentId: string | null,
): Promise<Tag> {
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');

  let { data, error } = await supabase
    .from('tags')
    .update({
      name: normalized,
      color,
      parent_id: parentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(TAG_COLUMNS)
    .single();

  if (isMissingAnalyticsColumn(error)) {
    ({ data, error } = await supabase
      .from('tags')
      .update({
        name: normalized,
        color,
        parent_id: parentId,
        updated_at: new Date().toISOString(),
      })
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
  if (!Number.isInteger(targetMinutes) || targetMinutes < 1 || targetMinutes > 1440) {
    throw new Error('Target must be between 1 and 1440 minutes');
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
      `id, started_at, ended_at, source, geofence_id,
       time_entry_tags(tag_id, tags(${nestedTagSelect}))`,
    )
    .eq('user_id', userId);

  if (filters) {
    query = query.gt('ended_at', filters.startMs).lt('started_at', filters.endMs);
  }

  const { data, error } = await query.order('started_at', { ascending: false });
  if (!isMissingAnalyticsColumn(error)) {
    if (error) throw error;
    return (data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
  }

  let legacyQuery = supabase
    .from('time_entries')
    .select(
      `id, started_at, ended_at, source, geofence_id,
       time_entry_tags(tag_id, tags(${NESTED_TAG_COLUMNS_LEGACY}))`,
    )
    .eq('user_id', userId);

  if (filters) {
    legacyQuery = legacyQuery.gt('ended_at', filters.startMs).lt('started_at', filters.endMs);
  }

  const fallback = await legacyQuery.order('started_at', { ascending: false });
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []).map((row) => mapEntry(row as unknown as EntryRow));
}

export async function fetchEntries(userId: string, startMs: number, endMs: number): Promise<TimeEntry[]> {
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
  },
): Promise<void> {
  const { data: entry, error: entryError } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      source: input.source,
      geofence_id: input.geofenceId ?? null,
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
}

export async function deleteTimeEntry(userId: string, entryId: string): Promise<void> {
  const { error: tagsError } = await supabase
    .from('time_entry_tags')
    .delete()
    .eq('entry_id', entryId)
    .eq('user_id', userId);
  if (tagsError) throw tagsError;

  const { error } = await supabase.from('time_entries').delete().eq('id', entryId).eq('user_id', userId);
  if (error) throw error;
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

export async function updateGeofence(
  userId: string,
  id: string,
  patch: Partial<Pick<Geofence, 'enabled' | 'name' | 'radiusMeters'>>,
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.enabled !== undefined) payload.enabled = patch.enabled;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.radiusMeters !== undefined) payload.radius_meters = patch.radiusMeters;

  const { error } = await supabase.from('geofences').update(payload).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteGeofence(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('geofences').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export function loadActiveSessions(): ActiveSession[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ActiveSession[]) : [];
    }

    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacy) return [];

    const session = JSON.parse(legacy) as ActiveSession;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([session]));
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return [session];
  } catch {
    return [];
  }
}

export function saveActiveSessions(sessions: ActiveSession[]): void {
  if (sessions.length === 0) {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

export function exportEntriesCsv(entries: TimeEntry[], geofenceNames: Map<string, string>): string {
  const header = ['started_at', 'ended_at', 'duration_minutes', 'source', 'tags', 'geofence_id', 'geofence_name'];
  const rows = entries.map((entry) => {
    const durationMinutes = ((entry.endedAt - entry.startedAt) / 60000).toFixed(2);
    const tags = entry.tags.map((tag) => tag.name).join('; ');
    const geofenceName = entry.geofenceId ? geofenceNames.get(entry.geofenceId) ?? '' : '';
    return [
      new Date(entry.startedAt).toISOString(),
      new Date(entry.endedAt).toISOString(),
      durationMinutes,
      entry.source,
      tags,
      entry.geofenceId ?? '',
      geofenceName,
    ];
  });

  const escape = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
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
