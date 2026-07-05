import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

import {
  DEFAULT_TAGS,
  MIGRATION_SQL,
  SCHEMA_VERSION,
  TAGS_V3_INDEX_SQL,
  type SyncEntityType,
  type SyncOperation,
} from './schema';
import type {
  ActiveSession,
  EntrySource,
  Geofence,
  Tag,
  TagDailyGoal,
  DailyGoalScore,
  TimeEntry,
} from '@/types';
import { wouldCreateCycle } from '@/utils/tagTree';
import type { MergedEntryFields } from '@/utils/entryMerge';

let db: SQLite.SQLiteDatabase | null = null;
let currentUserId: string | null = null;
let initialized = false;

function createId(): string {
  return Crypto.randomUUID();
}

function nowMs(): number {
  return Date.now();
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db || !currentUserId) {
    throw new Error('Database not initialized');
  }
  return db;
}

function requireUserId(): string {
  if (!currentUserId) throw new Error('User not authenticated');
  return currentUserId;
}

function rowToTag(row: {
  id: string;
  name: string;
  color: string;
  parent_id?: string | null;
  include_in_analytics?: number | boolean | null;
  description?: string | null;
}): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id ?? null,
    includeInAnalytics:
      row.include_in_analytics === 0 || row.include_in_analytics === false ? false : true,
    description: row.description?.trim() ? row.description.trim() : null,
  };
}

function normalizeDescription(description?: string | null): string | null {
  const trimmed = description?.trim();
  return trimmed ? trimmed : null;
}

function migrateTagsToV3(database: SQLite.SQLiteDatabase): void {
  const hasParentId = database.getFirstSync<{ name: string }>(
    "SELECT name FROM pragma_table_info('tags') WHERE name = 'parent_id'",
  );
  if (hasParentId) return;

  database.execSync('PRAGMA foreign_keys = OFF');
  database.execSync(`
    CREATE TABLE tags_v3 (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      parent_id TEXT,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES tags_v3(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX idx_tags_user_parent_name ON tags_v3(user_id, COALESCE(parent_id, ''), name);
    INSERT INTO tags_v3 (id, user_id, name, color, parent_id, updated_at)
      SELECT id, user_id, name, color, NULL, updated_at FROM tags;
    DROP TABLE tags;
    ALTER TABLE tags_v3 RENAME TO tags;
  `);
  database.execSync('PRAGMA foreign_keys = ON');
}

function migrateTagsToV4(database: SQLite.SQLiteDatabase): void {
  const hasIncludeInAnalytics = database.getFirstSync<{ name: string }>(
    "SELECT name FROM pragma_table_info('tags') WHERE name = 'include_in_analytics'",
  );
  if (hasIncludeInAnalytics) return;

  database.execSync('ALTER TABLE tags ADD COLUMN include_in_analytics INTEGER NOT NULL DEFAULT 1');
}

function migrateToV5(database: SQLite.SQLiteDatabase): void {
  const table = database.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tag_daily_goals'",
  );
  if (table) return;

  database.execSync(`
    CREATE TABLE tag_daily_goals (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      target_minutes INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE (user_id, tag_id)
    );
  `);
}

function migrateToV6(database: SQLite.SQLiteDatabase): void {
  const table = database.getFirstSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'daily_goal_scores'",
  );
  if (table) return;

  database.execSync(`
    CREATE TABLE daily_goal_scores (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      date_key TEXT NOT NULL,
      score_percent INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE (user_id, date_key)
    );
  `);
}

function migrateToV7(database: SQLite.SQLiteDatabase): void {
  const hasDescription = database.getFirstSync<{ name: string }>(
    "SELECT name FROM pragma_table_info('tags') WHERE name = 'description'",
  );
  if (hasDescription) return;

  database.execSync('ALTER TABLE tags ADD COLUMN description TEXT');
}

function migrateToV8(database: SQLite.SQLiteDatabase): void {
  const hasStopLatitude = database.getFirstSync<{ name: string }>(
    "SELECT name FROM pragma_table_info('time_entries') WHERE name = 'stop_latitude'",
  );
  if (hasStopLatitude) return;

  database.execSync('ALTER TABLE time_entries ADD COLUMN stop_latitude REAL');
  database.execSync('ALTER TABLE time_entries ADD COLUMN stop_longitude REAL');
  database.execSync('ALTER TABLE time_entries ADD COLUMN details TEXT');
}

function migrateActiveSessionsToEntries(
  database: SQLite.SQLiteDatabase,
  tableName = 'time_entries',
): void {
  const sessions = database.getAllSync<{
    id: string;
    user_id: string;
    started_at: number;
    source: EntrySource;
    geofence_id: string | null;
  }>('SELECT id, user_id, started_at, source, geofence_id FROM active_session');

  for (const session of sessions) {
    const tagRows = database.getAllSync<{ tag_id: string }>(
      'SELECT tag_id FROM active_session_tags WHERE session_id = ?',
      [session.id],
    );
    const ts = Date.now();

    database.runSync(
      `INSERT OR IGNORE INTO ${tableName}
       (id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, ?)`,
      [session.id, session.user_id, session.started_at, session.source, session.geofence_id, ts],
    );

    for (const tagRow of tagRows) {
      database.runSync(
        'INSERT OR IGNORE INTO time_entry_tags (entry_id, tag_id, user_id) VALUES (?, ?, ?)',
        [session.id, tagRow.tag_id, session.user_id],
      );
    }
  }

  if (sessions.length > 0) {
    database.execSync('DELETE FROM active_session_tags');
    database.execSync('DELETE FROM active_session');
  }
}

function migrateToV9(database: SQLite.SQLiteDatabase): void {
  const endedAtCol = database.getFirstSync<{ requiresEnd: number }>(
    "SELECT \"notnull\" AS requiresEnd FROM pragma_table_info('time_entries') WHERE name = 'ended_at'",
  );

  if (endedAtCol?.requiresEnd === 0) {
    migrateActiveSessionsToEntries(database);
    return;
  }

  database.execSync(`
    CREATE TABLE IF NOT EXISTS time_entries_v9 (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      source TEXT NOT NULL,
      geofence_id TEXT,
      stop_latitude REAL,
      stop_longitude REAL,
      details TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  database.execSync(`
    INSERT INTO time_entries_v9 (
      id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at
    )
    SELECT
      id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at
    FROM time_entries;
  `);

  migrateActiveSessionsToEntries(database, 'time_entries_v9');

  database.execSync('DROP TABLE time_entries');
  database.execSync('ALTER TABLE time_entries_v9 RENAME TO time_entries');
}

function validateSiblingName(
  userId: string,
  name: string,
  parentId: string | null,
  excludeId?: string,
): void {
  const row = getDb().getFirstSync<{ id: string }>(
    `SELECT id FROM tags
     WHERE user_id = ? AND name = ? AND COALESCE(parent_id, '') = COALESCE(?, '')
       AND id != COALESCE(?, '')`,
    [userId, name, parentId ?? '', excludeId ?? ''],
  );
  if (row) throw new Error('A tag with this name already exists under the same parent');
}

function validateParentId(userId: string, parentId: string | null, tagId?: string): void {
  if (!parentId) return;

  const parent = getDb().getFirstSync<{ id: string }>(
    'SELECT id FROM tags WHERE id = ? AND user_id = ?',
    [parentId, userId],
  );
  if (!parent) throw new Error('Parent tag not found');

  if (tagId) {
    const allTags = getAllTags();
    if (wouldCreateCycle(tagId, parentId, allTags)) {
      throw new Error('Cannot nest a tag under itself or its descendants');
    }
  }
}

function loadTagsForEntry(entryId: string): Tag[] {
  const userId = requireUserId();
  return getDb()
    .getAllSync<{
      id: string;
      name: string;
      color: string;
      parent_id: string | null;
      include_in_analytics: number;
    }>(
      `SELECT t.id, t.name, t.color, t.parent_id, t.include_in_analytics, t.description
       FROM tags t
       INNER JOIN time_entry_tags tet ON tet.tag_id = t.id
       WHERE tet.entry_id = ? AND tet.user_id = ?`,
      [entryId, userId],
    )
    .map(rowToTag);
}

function entryToActiveSession(entry: TimeEntry): ActiveSession {
  return {
    id: entry.id,
    startedAt: entry.startedAt,
    source: entry.source,
    geofenceId: entry.geofenceId,
    tags: entry.tags,
  };
}

const ENTRY_COLUMNS =
  'id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details';

type EntryRow = {
  id: string;
  started_at: number;
  ended_at: number | null;
  source: EntrySource;
  geofence_id: string | null;
  stop_latitude: number | null;
  stop_longitude: number | null;
  details: string | null;
};

function normalizeEntryDetails(details: string | null | undefined): string | null {
  const trimmed = details?.trim();
  return trimmed ? trimmed : null;
}

function mapEntryRow(row: EntryRow): TimeEntry {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    source: row.source,
    geofenceId: row.geofence_id,
    stopLatitude: row.stop_latitude ?? null,
    stopLongitude: row.stop_longitude ?? null,
    details: normalizeEntryDetails(row.details),
    tags: loadTagsForEntry(row.id),
  };
}

function buildEntrySyncPayload(input: {
  id: string;
  userId: string;
  startedAt: number;
  endedAt: number | null;
  source: EntrySource;
  geofenceId: string | null;
  stopLatitude: number | null;
  stopLongitude: number | null;
  details: string | null;
  tagIds: string[];
  updatedAtIso: string;
}) {
  return {
    id: input.id,
    user_id: input.userId,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    source: input.source,
    geofence_id: input.geofenceId,
    stop_latitude: input.stopLatitude,
    stop_longitude: input.stopLongitude,
    details: input.details,
    updated_at: input.updatedAtIso,
    tag_ids: input.tagIds,
  };
}

function getTimeEntryById(id: string): TimeEntry | null {
  const userId = requireUserId();
  const row = getDb().getFirstSync<EntryRow>(
    `SELECT ${ENTRY_COLUMNS} FROM time_entries WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return row ? mapEntryRow(row) : null;
}

export function enqueueSync(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): void {
  getDb().runSync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [createId(), entityType, entityId, operation, JSON.stringify(payload), nowMs()],
  );
}

export function getSyncQueue(): Array<{
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
}> {
  return getDb()
    .getAllSync<{
      id: string;
      entity_type: SyncEntityType;
      entity_id: string;
      operation: SyncOperation;
      payload: string;
    }>(
      'SELECT id, entity_type, entity_id, operation, payload FROM sync_queue ORDER BY created_at ASC',
    )
    .map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      payload: JSON.parse(row.payload) as Record<string, unknown>,
    }));
}

export function removeSyncQueueItem(id: string): void {
  getDb().runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export function getLastPulledAt(): number {
  const userId = requireUserId();
  const row = getDb().getFirstSync<{ last_pulled_at: number }>(
    'SELECT last_pulled_at FROM sync_state WHERE user_id = ?',
    [userId],
  );
  return row?.last_pulled_at ?? 0;
}

export function setLastPulledAt(timestamp: number): void {
  const userId = requireUserId();
  getDb().runSync(
    `INSERT INTO sync_state (user_id, last_pulled_at) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET last_pulled_at = excluded.last_pulled_at`,
    [userId, timestamp],
  );
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function isDatabaseReady(): boolean {
  return db !== null && currentUserId !== null && initialized;
}

export function resetDatabase(): void {
  if (db) {
    try {
      db.closeSync();
    } catch {
      // Ignore close errors during reset.
    }
  }
  db = null;
  currentUserId = null;
  initialized = false;
}

let initializingUserId: string | null = null;

export function initDatabase(userId: string): void {
  if (initialized && currentUserId === userId) return;
  if (initializingUserId === userId) return;

  initializingUserId = userId;

  try {
    if (db) {
      try {
        db.closeSync();
      } catch {
        // Ignore close errors when switching users.
      }
      db = null;
    }

    db = SQLite.openDatabaseSync(`timetracker-${userId}.db`);
    currentUserId = userId;
    initialized = false;

    const database = getDb();
    database.execSync(MIGRATION_SQL);

    // Existing v2 databases have a tags table without parent_id; migrate before index creation.
    migrateTagsToV3(database);
    migrateTagsToV4(database);
    migrateToV5(database);
    migrateToV6(database);
    migrateToV7(database);
    migrateToV8(database);
    migrateToV9(database);
    database.execSync(TAGS_V3_INDEX_SQL);

    const versionRow = database.getFirstSync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      ['schema_version'],
    );

    if (!versionRow) {
      database.runSync('INSERT INTO meta (key, value) VALUES (?, ?)', [
        'schema_version',
        String(SCHEMA_VERSION),
      ]);
      database.runSync('INSERT INTO sync_state (user_id, last_pulled_at) VALUES (?, ?)', [
        userId,
        0,
      ]);
    } else {
      database.runSync(
        `INSERT INTO sync_state (user_id, last_pulled_at) VALUES (?, ?)
       ON CONFLICT(user_id) DO NOTHING`,
        [userId, 0],
      );

      const storedVersion = parseInt(versionRow.value, 10);
      if (storedVersion < SCHEMA_VERSION) {
        if (storedVersion < 3) {
          migrateTagsToV3(database);
        }
        if (storedVersion < 4) {
          migrateTagsToV4(database);
        }
        if (storedVersion < 5) {
          migrateToV5(database);
        }
        if (storedVersion < 6) {
          migrateToV6(database);
        }
        if (storedVersion < 7) {
          migrateToV7(database);
        }
        if (storedVersion < 8) {
          migrateToV8(database);
        }
        if (storedVersion < 9) {
          migrateToV9(database);
        }
        database.runSync('UPDATE meta SET value = ? WHERE key = ?', [
          String(SCHEMA_VERSION),
          'schema_version',
        ]);
      }
    }

    initialized = true;
  } finally {
    if (initializingUserId === userId) {
      initializingUserId = null;
    }
  }
}

export function seedLocalDefaultTagsIfEmpty(): void {
  const userId = requireUserId();
  const tagCount = getDb().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tags WHERE user_id = ?',
    [userId],
  );

  if (tagCount && tagCount.count > 0) return;

  const ts = nowMs();
  for (const tag of DEFAULT_TAGS) {
    const id = createId();
    getDb().runSync(
      'INSERT INTO tags (id, user_id, name, color, parent_id, include_in_analytics, description, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, tag.name, tag.color, null, 1, null, ts],
    );
    enqueueSync('tag', id, 'upsert', {
      id,
      user_id: userId,
      name: tag.name,
      color: tag.color,
      parent_id: null,
      include_in_analytics: true,
      description: null,
      updated_at: new Date(ts).toISOString(),
    });
  }
}

export function upsertTagFromRemote(tag: {
  id: string;
  user_id: string;
  name: string;
  color: string;
  parent_id?: string | null;
  include_in_analytics?: boolean | null;
  description?: string | null;
  updated_at: string;
}): void {
  const updatedAt = new Date(tag.updated_at).getTime();
  const userId = tag.user_id;
  const parentId = tag.parent_id ?? null;
  const database = getDb();

  const duplicate = database.getFirstSync<{ id: string }>(
    `SELECT id FROM tags
     WHERE user_id = ? AND name = ? AND COALESCE(parent_id, '') = COALESCE(?, '') AND id != ?`,
    [userId, tag.name, parentId ?? '', tag.id],
  );

  if (duplicate) {
    database.execSync('PRAGMA foreign_keys = OFF');
    database.runSync('UPDATE time_entry_tags SET tag_id = ? WHERE tag_id = ?', [
      tag.id,
      duplicate.id,
    ]);
    database.runSync('UPDATE active_session_tags SET tag_id = ? WHERE tag_id = ?', [
      tag.id,
      duplicate.id,
    ]);
    database.runSync('UPDATE geofences SET tag_id = ? WHERE tag_id = ?', [tag.id, duplicate.id]);
    database.runSync('UPDATE tag_daily_goals SET tag_id = ? WHERE tag_id = ?', [
      tag.id,
      duplicate.id,
    ]);
    database.runSync('UPDATE tags SET parent_id = ? WHERE parent_id = ?', [tag.id, duplicate.id]);
    database.runSync('DELETE FROM tags WHERE id = ?', [duplicate.id]);
    database.execSync('PRAGMA foreign_keys = ON');
  }

  const existingLocal = database.getFirstSync<{ include_in_analytics: number }>(
    'SELECT include_in_analytics FROM tags WHERE id = ? AND user_id = ?',
    [tag.id, userId],
  );

  const pendingAnalytics = getSyncQueue()
    .filter(
      (item) =>
        item.entityType === 'tag' && item.entityId === tag.id && item.operation === 'upsert',
    )
    .map((item) => item.payload.include_in_analytics)
    .find((value): value is boolean => typeof value === 'boolean');

  let includeInAnalytics: number;
  if (pendingAnalytics !== undefined) {
    includeInAnalytics = pendingAnalytics ? 1 : 0;
  } else if (typeof tag.include_in_analytics === 'boolean') {
    includeInAnalytics = tag.include_in_analytics ? 1 : 0;
  } else {
    includeInAnalytics = existingLocal?.include_in_analytics ?? 1;
  }

  database.runSync(
    `INSERT INTO tags (id, user_id, name, color, parent_id, include_in_analytics, description, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       color = excluded.color,
       parent_id = excluded.parent_id,
       include_in_analytics = excluded.include_in_analytics,
       description = excluded.description,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= tags.updated_at`,
    [
      tag.id,
      tag.user_id,
      tag.name,
      tag.color,
      tag.parent_id ?? null,
      includeInAnalytics,
      normalizeDescription(tag.description),
      updatedAt,
    ],
  );
}

export function deleteTagLocally(id: string): void {
  getDb().runSync('DELETE FROM tags WHERE id = ? AND user_id = ?', [id, requireUserId()]);
}

export function upsertEntryFromRemote(entry: {
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
}): void {
  const updatedAt = new Date(entry.updated_at).getTime();
  const userId = requireUserId();
  const database = getDb();

  database.runSync(
    `INSERT INTO time_entries (id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       started_at = excluded.started_at,
       ended_at = excluded.ended_at,
       source = excluded.source,
       geofence_id = excluded.geofence_id,
       stop_latitude = excluded.stop_latitude,
       stop_longitude = excluded.stop_longitude,
       details = excluded.details,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= time_entries.updated_at`,
    [
      entry.id,
      entry.user_id,
      entry.started_at,
      entry.ended_at,
      entry.source,
      entry.geofence_id,
      entry.stop_latitude ?? null,
      entry.stop_longitude ?? null,
      normalizeEntryDetails(entry.details),
      updatedAt,
    ],
  );

  database.runSync('DELETE FROM time_entry_tags WHERE entry_id = ?', [entry.id]);
  for (const tagId of entry.tag_ids) {
    database.runSync('INSERT INTO time_entry_tags (entry_id, tag_id, user_id) VALUES (?, ?, ?)', [
      entry.id,
      tagId,
      userId,
    ]);
  }
}

export function upsertGeofenceFromRemote(geofence: {
  id: string;
  user_id: string;
  tag_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  enabled: boolean;
  updated_at: string;
}): void {
  const updatedAt = new Date(geofence.updated_at).getTime();
  getDb().runSync(
    `INSERT INTO geofences (id, user_id, tag_id, name, latitude, longitude, radius_meters, enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       tag_id = excluded.tag_id,
       name = excluded.name,
       latitude = excluded.latitude,
       longitude = excluded.longitude,
       radius_meters = excluded.radius_meters,
       enabled = excluded.enabled,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= geofences.updated_at`,
    [
      geofence.id,
      geofence.user_id,
      geofence.tag_id,
      geofence.name,
      geofence.latitude,
      geofence.longitude,
      geofence.radius_meters,
      geofence.enabled ? 1 : 0,
      updatedAt,
    ],
  );
}

export function deleteGeofenceLocally(id: string): void {
  getDb().runSync('DELETE FROM geofences WHERE id = ? AND user_id = ?', [id, requireUserId()]);
}

export function getAllTags(): Tag[] {
  const userId = requireUserId();
  return getDb()
    .getAllSync<{
      id: string;
      name: string;
      color: string;
      parent_id: string | null;
      include_in_analytics: number;
      description: string | null;
    }>(
      'SELECT id, name, color, parent_id, include_in_analytics, description FROM tags WHERE user_id = ? ORDER BY name ASC',
      [userId],
    )
    .map(rowToTag);
}

export function createTag(
  name: string,
  color: string,
  parentId: string | null = null,
  description: string | null = null,
): Tag {
  const userId = requireUserId();
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');

  validateParentId(userId, parentId);
  validateSiblingName(userId, normalized, parentId);

  const ts = nowMs();
  const normalizedDescription = normalizeDescription(description);
  const tag: Tag = {
    id: createId(),
    name: normalized,
    color,
    parentId,
    includeInAnalytics: true,
    description: normalizedDescription,
  };
  getDb().runSync(
    'INSERT INTO tags (id, user_id, name, color, parent_id, include_in_analytics, description, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tag.id, userId, tag.name, tag.color, parentId, 1, normalizedDescription, ts],
  );
  enqueueSync('tag', tag.id, 'upsert', {
    id: tag.id,
    user_id: userId,
    name: tag.name,
    color: tag.color,
    parent_id: parentId,
    include_in_analytics: true,
    description: normalizedDescription,
    updated_at: new Date(ts).toISOString(),
  });
  return tag;
}

export function updateTag(
  id: string,
  name: string,
  color: string,
  parentId?: string | null,
  description?: string | null,
): Tag {
  const userId = requireUserId();
  const existing = getDb().getFirstSync<{
    id: string;
    name: string;
    color: string;
    parent_id: string | null;
    include_in_analytics: number;
    description: string | null;
  }>(
    'SELECT id, name, color, parent_id, include_in_analytics, description FROM tags WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  if (!existing) throw new Error('Tag not found');

  const resolvedParentId = parentId !== undefined ? parentId : existing.parent_id;
  const resolvedDescription =
    description !== undefined
      ? normalizeDescription(description)
      : normalizeDescription(existing.description);
  const normalized = name.replace(/^#/, '').trim().toLowerCase();
  if (!normalized) throw new Error('Tag name is required');

  validateParentId(userId, resolvedParentId, id);
  validateSiblingName(userId, normalized, resolvedParentId, id);

  const ts = nowMs();
  getDb().runSync(
    'UPDATE tags SET name = ?, color = ?, parent_id = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [normalized, color, resolvedParentId, resolvedDescription, ts, id, userId],
  );
  enqueueSync('tag', id, 'upsert', {
    id,
    user_id: userId,
    name: normalized,
    color,
    parent_id: resolvedParentId,
    include_in_analytics: existing.include_in_analytics !== 0,
    description: resolvedDescription,
    updated_at: new Date(ts).toISOString(),
  });
  return {
    id,
    name: normalized,
    color,
    parentId: resolvedParentId,
    includeInAnalytics: existing.include_in_analytics !== 0,
    description: resolvedDescription,
  };
}

export function setTagIncludeInAnalytics(id: string, includeInAnalytics: boolean): Tag {
  const userId = requireUserId();
  const existing = getDb().getFirstSync<{
    id: string;
    name: string;
    color: string;
    parent_id: string | null;
    include_in_analytics: number;
    description: string | null;
  }>(
    'SELECT id, name, color, parent_id, include_in_analytics, description FROM tags WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  if (!existing) throw new Error('Tag not found');

  const ts = nowMs();
  const includeValue = includeInAnalytics ? 1 : 0;
  getDb().runSync(
    'UPDATE tags SET include_in_analytics = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [includeValue, ts, id, userId],
  );
  enqueueSync('tag', id, 'upsert', {
    id,
    user_id: userId,
    name: existing.name,
    color: existing.color,
    parent_id: existing.parent_id,
    include_in_analytics: includeInAnalytics,
    description: normalizeDescription(existing.description),
    updated_at: new Date(ts).toISOString(),
  });
  return {
    id,
    name: existing.name,
    color: existing.color,
    parentId: existing.parent_id,
    includeInAnalytics,
    description: normalizeDescription(existing.description),
  };
}

export function deleteTag(id: string): void {
  const userId = requireUserId();
  const linked = getDb().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM geofences WHERE tag_id = ? AND user_id = ?',
    [id, userId],
  );
  if (linked && linked.count > 0) {
    throw new Error('Remove geofences linked to this tag first');
  }

  const childCount = getDb().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tags WHERE parent_id = ? AND user_id = ?',
    [id, userId],
  );
  if (childCount && childCount.count > 0) {
    throw new Error('Delete child tags first');
  }

  getDb().runSync('DELETE FROM tags WHERE id = ? AND user_id = ?', [id, userId]);
  enqueueSync('tag', id, 'delete', { id, user_id: userId });
}

export function getActiveSessions(): ActiveSession[] {
  const userId = requireUserId();
  const rows = getDb().getAllSync<EntryRow>(
    `SELECT ${ENTRY_COLUMNS}
     FROM time_entries
     WHERE user_id = ? AND ended_at IS NULL
     ORDER BY started_at ASC`,
    [userId],
  );

  return rows.map((row) => entryToActiveSession(mapEntryRow(row)));
}

export function getActiveSession(): ActiveSession | null {
  return getActiveSessions()[0] ?? null;
}

export function getActiveSessionById(sessionId: string): ActiveSession | null {
  return getActiveSessions().find((session) => session.id === sessionId) ?? null;
}

export function getActiveSessionByGeofenceId(geofenceId: string): ActiveSession | null {
  return getActiveSessions().find((session) => session.geofenceId === geofenceId) ?? null;
}

export function startSession(
  tagIds: string[],
  source: EntrySource,
  geofenceId: string | null = null,
): ActiveSession {
  const userId = requireUserId();
  const database = getDb();

  if (geofenceId) {
    const existing = getActiveSessionByGeofenceId(geofenceId);
    if (existing) return existing;
  }

  const allTags = getAllTags();
  const tags = tagIds
    .map((tagId) => allTags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => tag !== undefined);
  if (tags.length === 0) throw new Error('Select at least one tag');

  const ts = nowMs();
  const entry: TimeEntry = {
    id: createId(),
    startedAt: ts,
    endedAt: null,
    source,
    geofenceId,
    stopLatitude: null,
    stopLongitude: null,
    details: null,
    tags,
  };

  database.runSync(
    `INSERT INTO time_entries (id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at)
     VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, ?)`,
    [entry.id, userId, entry.startedAt, entry.source, entry.geofenceId, ts],
  );

  for (const tag of tags) {
    database.runSync('INSERT INTO time_entry_tags (entry_id, tag_id, user_id) VALUES (?, ?, ?)', [
      entry.id,
      tag.id,
      userId,
    ]);
  }

  enqueueSync(
    'entry',
    entry.id,
    'upsert',
    buildEntrySyncPayload({
      id: entry.id,
      userId,
      startedAt: entry.startedAt,
      endedAt: null,
      source: entry.source,
      geofenceId: entry.geofenceId,
      stopLatitude: null,
      stopLongitude: null,
      details: null,
      tagIds: tags.map((t) => t.id),
      updatedAtIso: new Date(ts).toISOString(),
    }),
  );

  return entryToActiveSession(entry);
}

export interface StopSessionOptions {
  endedAt?: number;
  stopLatitude?: number | null;
  stopLongitude?: number | null;
  details?: string | null;
}

export function stopSession(sessionId: string, options: StopSessionOptions = {}): TimeEntry | null {
  const session = getActiveSessionById(sessionId);
  if (!session) return null;

  const userId = requireUserId();
  const database = getDb();
  const ts = nowMs();
  const endedAt = options.endedAt ?? Date.now();
  const stopLatitude = options.stopLatitude ?? null;
  const stopLongitude = options.stopLongitude ?? null;
  const details = normalizeEntryDetails(options.details);

  database.runSync(
    `UPDATE time_entries
     SET ended_at = ?, stop_latitude = ?, stop_longitude = ?, details = ?, updated_at = ?
     WHERE id = ? AND user_id = ? AND ended_at IS NULL`,
    [endedAt, stopLatitude, stopLongitude, details, ts, sessionId, userId],
  );

  const entry = getTimeEntryById(sessionId);
  if (!entry || entry.endedAt == null) return null;

  enqueueSync(
    'entry',
    entry.id,
    'upsert',
    buildEntrySyncPayload({
      id: entry.id,
      userId,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      source: entry.source,
      geofenceId: entry.geofenceId,
      stopLatitude: entry.stopLatitude,
      stopLongitude: entry.stopLongitude,
      details: entry.details,
      tagIds: entry.tags.map((t) => t.id),
      updatedAtIso: new Date(ts).toISOString(),
    }),
  );

  return entry;
}

export function createManualEntry(tagIds: string[], startedAt: number, endedAt: number): TimeEntry {
  const userId = requireUserId();
  if (tagIds.length === 0) throw new Error('Select at least one tag');
  if (endedAt <= startedAt) throw new Error('End must be after start');
  if (endedAt > Date.now()) throw new Error('End cannot be in the future');

  const allTags = getAllTags();
  const tags = tagIds
    .map((tagId) => allTags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => tag !== undefined);
  if (tags.length === 0) throw new Error('Select at least one tag');

  const database = getDb();
  const ts = nowMs();
  const entry: TimeEntry = {
    id: createId(),
    startedAt,
    endedAt,
    source: 'manual',
    geofenceId: null,
    stopLatitude: null,
    stopLongitude: null,
    details: null,
    tags,
  };

  database.runSync(
    `INSERT INTO time_entries (id, user_id, started_at, ended_at, source, geofence_id, stop_latitude, stop_longitude, details, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      userId,
      entry.startedAt,
      entry.endedAt,
      entry.source,
      entry.geofenceId,
      null,
      null,
      null,
      ts,
    ],
  );

  for (const tag of tags) {
    database.runSync('INSERT INTO time_entry_tags (entry_id, tag_id, user_id) VALUES (?, ?, ?)', [
      entry.id,
      tag.id,
      userId,
    ]);
  }

  enqueueSync(
    'entry',
    entry.id,
    'upsert',
    buildEntrySyncPayload({
      id: entry.id,
      userId,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      source: entry.source,
      geofenceId: entry.geofenceId,
      stopLatitude: null,
      stopLongitude: null,
      details: null,
      tagIds: tags.map((t) => t.id),
      updatedAtIso: new Date(ts).toISOString(),
    }),
  );

  return entry;
}

export function updateEntryStopDetails(
  id: string,
  input: {
    details?: string | null;
    stopLatitude?: number | null;
    stopLongitude?: number | null;
  },
): TimeEntry {
  const userId = requireUserId();
  const existing = getTimeEntryById(id);
  if (!existing) throw new Error('Entry not found');

  const ts = nowMs();
  const details =
    input.details !== undefined ? normalizeEntryDetails(input.details) : existing.details;
  const stopLatitude =
    input.stopLatitude !== undefined ? input.stopLatitude : existing.stopLatitude;
  const stopLongitude =
    input.stopLongitude !== undefined ? input.stopLongitude : existing.stopLongitude;

  getDb().runSync(
    `UPDATE time_entries
     SET details = ?, stop_latitude = ?, stop_longitude = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [details, stopLatitude, stopLongitude, ts, id, userId],
  );

  enqueueSync(
    'entry',
    id,
    'upsert',
    buildEntrySyncPayload({
      id,
      userId,
      startedAt: existing.startedAt,
      endedAt: existing.endedAt,
      source: existing.source,
      geofenceId: existing.geofenceId,
      stopLatitude,
      stopLongitude,
      details,
      tagIds: existing.tags.map((t) => t.id),
      updatedAtIso: new Date(ts).toISOString(),
    }),
  );

  const updated = getTimeEntryById(id);
  if (!updated) throw new Error('Failed to update entry');
  return updated;
}

export function updateEntry(
  id: string,
  tagIds: string[],
  startedAt: number,
  endedAt: number,
  details?: string | null,
): TimeEntry {
  const userId = requireUserId();
  if (tagIds.length === 0) throw new Error('Select at least one tag');
  if (endedAt <= startedAt) throw new Error('End must be after start');
  if (endedAt > Date.now()) throw new Error('End cannot be in the future');

  const database = getDb();
  const existing = database.getFirstSync<EntryRow>(
    `SELECT ${ENTRY_COLUMNS}
     FROM time_entries
     WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  if (!existing) throw new Error('Entry not found');
  if (existing.ended_at == null) throw new Error('Cannot edit an active session');

  const allTags = getAllTags();
  const tags = tagIds
    .map((tagId) => allTags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => tag !== undefined);
  if (tags.length === 0) throw new Error('Select at least one tag');

  const ts = nowMs();
  const nextDetails =
    details !== undefined
      ? normalizeEntryDetails(details)
      : normalizeEntryDetails(existing.details);
  database.runSync(
    `UPDATE time_entries
     SET started_at = ?, ended_at = ?, details = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [startedAt, endedAt, nextDetails, ts, id, userId],
  );

  database.runSync('DELETE FROM time_entry_tags WHERE entry_id = ? AND user_id = ?', [id, userId]);
  for (const tag of tags) {
    database.runSync('INSERT INTO time_entry_tags (entry_id, tag_id, user_id) VALUES (?, ?, ?)', [
      id,
      tag.id,
      userId,
    ]);
  }

  const entry: TimeEntry = {
    id,
    startedAt,
    endedAt,
    source: existing.source,
    geofenceId: existing.geofence_id,
    stopLatitude: existing.stop_latitude ?? null,
    stopLongitude: existing.stop_longitude ?? null,
    details: nextDetails,
    tags,
  };

  enqueueSync(
    'entry',
    id,
    'upsert',
    buildEntrySyncPayload({
      id,
      userId,
      startedAt,
      endedAt,
      source: existing.source,
      geofenceId: existing.geofence_id,
      stopLatitude: entry.stopLatitude,
      stopLongitude: entry.stopLongitude,
      details: nextDetails,
      tagIds: tags.map((t) => t.id),
      updatedAtIso: new Date(ts).toISOString(),
    }),
  );

  return entry;
}

export function getEntriesBetween(startMs: number, endMs: number): TimeEntry[] {
  const userId = requireUserId();
  const rows = getDb().getAllSync<EntryRow>(
    `SELECT ${ENTRY_COLUMNS}
     FROM time_entries
     WHERE user_id = ? AND ended_at IS NOT NULL AND ended_at > ? AND started_at < ?
     ORDER BY started_at DESC`,
    [userId, startMs, endMs],
  );

  return rows.map(mapEntryRow);
}

export function getTodayEntries(): TimeEntry[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return getEntriesBetween(start.getTime(), end.getTime());
}

export function getAllEntries(): TimeEntry[] {
  const userId = requireUserId();
  const rows = getDb().getAllSync<EntryRow>(
    `SELECT ${ENTRY_COLUMNS}
     FROM time_entries
     WHERE user_id = ? AND ended_at IS NOT NULL
     ORDER BY started_at ASC`,
    [userId],
  );

  return rows.map(mapEntryRow);
}

export function deleteEntry(id: string): void {
  const userId = requireUserId();
  const database = getDb();
  database.runSync('DELETE FROM time_entry_tags WHERE entry_id = ? AND user_id = ?', [id, userId]);
  database.runSync('DELETE FROM time_entries WHERE id = ? AND user_id = ?', [id, userId]);
  enqueueSync('entry', id, 'delete', { id, user_id: userId });
}

export function mergeEntries(
  keepEntryId: string,
  deleteEntryId: string,
  fields: MergedEntryFields,
): TimeEntry {
  const kept = getTimeEntryById(keepEntryId);
  if (!kept) throw new Error('Entry not found');
  if (kept.endedAt == null) throw new Error('Cannot merge into an active session');

  const tagIds = kept.tags.map((tag) => tag.id);
  updateEntry(keepEntryId, tagIds, fields.startedAt, fields.endedAt, fields.details);
  updateEntryStopDetails(keepEntryId, {
    stopLatitude: fields.stopLatitude,
    stopLongitude: fields.stopLongitude,
  });
  deleteEntry(deleteEntryId);

  const merged = getTimeEntryById(keepEntryId);
  if (!merged) throw new Error('Failed to merge entries');
  return merged;
}

export function clearAllTrackedData(): number {
  const userId = requireUserId();
  const database = getDb();

  const countRow = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM time_entries WHERE user_id = ?',
    [userId],
  );
  const count = countRow?.count ?? 0;

  database.runSync(
    'DELETE FROM active_session_tags WHERE session_id IN (SELECT id FROM active_session WHERE user_id = ?)',
    [userId],
  );
  database.runSync('DELETE FROM active_session WHERE user_id = ?', [userId]);
  database.runSync('DELETE FROM time_entry_tags WHERE user_id = ?', [userId]);
  database.runSync('DELETE FROM time_entries WHERE user_id = ?', [userId]);
  database.runSync("DELETE FROM sync_queue WHERE entity_type = 'entry'");

  return count;
}

export function getAllGeofences(): Geofence[] {
  const userId = requireUserId();
  const rows = getDb().getAllSync<{
    id: string;
    tag_id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    enabled: number;
    tag_name: string;
    tag_color: string;
  }>(
    `SELECT g.id, g.tag_id, g.name, g.latitude, g.longitude, g.radius_meters, g.enabled,
            t.name as tag_name, t.color as tag_color
     FROM geofences g
     INNER JOIN tags t ON t.id = g.tag_id
     WHERE g.user_id = ?
     ORDER BY g.name ASC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    tagId: row.tag_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius_meters,
    enabled: row.enabled === 1,
    tag: {
      id: row.tag_id,
      name: row.tag_name,
      color: row.tag_color,
      parentId: null,
      includeInAnalytics: true,
      description: null,
    },
  }));
}

export function getGeofenceById(id: string): Geofence | null {
  const userId = requireUserId();
  const row = getDb().getFirstSync<{
    id: string;
    tag_id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    enabled: number;
    tag_name: string;
    tag_color: string;
  }>(
    `SELECT g.id, g.tag_id, g.name, g.latitude, g.longitude, g.radius_meters, g.enabled,
            t.name as tag_name, t.color as tag_color
     FROM geofences g
     INNER JOIN tags t ON t.id = g.tag_id
     WHERE g.id = ? AND g.user_id = ?`,
    [id, userId],
  );

  if (!row) return null;

  return {
    id: row.id,
    tagId: row.tag_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius_meters,
    enabled: row.enabled === 1,
    tag: {
      id: row.tag_id,
      name: row.tag_name,
      color: row.tag_color,
      parentId: null,
      includeInAnalytics: true,
      description: null,
    },
  };
}

export function createGeofence(input: {
  tagId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}): Geofence {
  const userId = requireUserId();
  const id = createId();
  const ts = nowMs();
  getDb().runSync(
    `INSERT INTO geofences (id, user_id, tag_id, name, latitude, longitude, radius_meters, enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id, userId, input.tagId, input.name, input.latitude, input.longitude, input.radiusMeters, ts],
  );
  enqueueSync('geofence', id, 'upsert', {
    id,
    user_id: userId,
    tag_id: input.tagId,
    name: input.name,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_meters: input.radiusMeters,
    enabled: true,
    updated_at: new Date(ts).toISOString(),
  });
  const geofence = getGeofenceById(id);
  if (!geofence) throw new Error('Failed to create geofence');
  return geofence;
}

export function updateGeofence(
  id: string,
  input: Partial<{
    tagId: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    enabled: boolean;
  }>,
): Geofence {
  const userId = requireUserId();
  const existing = getGeofenceById(id);
  if (!existing) throw new Error('Geofence not found');

  const ts = nowMs();
  const enabled = input.enabled !== undefined ? input.enabled : existing.enabled;

  getDb().runSync(
    `UPDATE geofences
     SET tag_id = ?, name = ?, latitude = ?, longitude = ?, radius_meters = ?, enabled = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.tagId ?? existing.tagId,
      input.name ?? existing.name,
      input.latitude ?? existing.latitude,
      input.longitude ?? existing.longitude,
      input.radiusMeters ?? existing.radiusMeters,
      enabled ? 1 : 0,
      ts,
      id,
      userId,
    ],
  );

  enqueueSync('geofence', id, 'upsert', {
    id,
    user_id: userId,
    tag_id: input.tagId ?? existing.tagId,
    name: input.name ?? existing.name,
    latitude: input.latitude ?? existing.latitude,
    longitude: input.longitude ?? existing.longitude,
    radius_meters: input.radiusMeters ?? existing.radiusMeters,
    enabled,
    updated_at: new Date(ts).toISOString(),
  });

  const updated = getGeofenceById(id);
  if (!updated) throw new Error('Failed to update geofence');
  return updated;
}

export function deleteGeofence(id: string): void {
  const userId = requireUserId();
  getDb().runSync('DELETE FROM geofences WHERE id = ? AND user_id = ?', [id, userId]);
  enqueueSync('geofence', id, 'delete', { id, user_id: userId });
}

export function getEnabledGeofences(): Geofence[] {
  return getAllGeofences().filter((g) => g.enabled);
}

function rowToGoal(row: { id: string; tag_id: string; target_minutes: number }): TagDailyGoal {
  return {
    id: row.id,
    tagId: row.tag_id,
    targetMinutes: row.target_minutes,
  };
}

export function getGoals(): TagDailyGoal[] {
  const userId = requireUserId();
  return getDb()
    .getAllSync<{ id: string; tag_id: string; target_minutes: number }>(
      'SELECT id, tag_id, target_minutes FROM tag_daily_goals WHERE user_id = ? ORDER BY tag_id ASC',
      [userId],
    )
    .map(rowToGoal);
}

export function getGoalByTagId(tagId: string): TagDailyGoal | null {
  const userId = requireUserId();
  const row = getDb().getFirstSync<{ id: string; tag_id: string; target_minutes: number }>(
    'SELECT id, tag_id, target_minutes FROM tag_daily_goals WHERE user_id = ? AND tag_id = ?',
    [userId, tagId],
  );
  return row ? rowToGoal(row) : null;
}

export function setGoal(tagId: string, targetMinutes: number): TagDailyGoal {
  const userId = requireUserId();
  if (!Number.isInteger(targetMinutes) || targetMinutes < 0 || targetMinutes > 1440) {
    throw new Error('Target must be between 0 and 1440 minutes');
  }

  const tag = getAllTags().find((item) => item.id === tagId);
  if (!tag) throw new Error('Tag not found');
  if (tag.parentId !== null) throw new Error('Goals can only be set on top-level categories');

  const ts = nowMs();
  const existing = getGoalByTagId(tagId);
  const id = existing?.id ?? createId();

  getDb().runSync(
    `INSERT INTO tag_daily_goals (id, user_id, tag_id, target_minutes, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, tag_id) DO UPDATE SET
       target_minutes = excluded.target_minutes,
       updated_at = excluded.updated_at`,
    [id, userId, tagId, targetMinutes, ts],
  );

  enqueueSync('goal', id, 'upsert', {
    id,
    user_id: userId,
    tag_id: tagId,
    target_minutes: targetMinutes,
    updated_at: new Date(ts).toISOString(),
  });

  const goal = getGoalByTagId(tagId);
  if (!goal) throw new Error('Failed to save goal');
  return goal;
}

export function removeGoal(tagId: string): void {
  const userId = requireUserId();
  const existing = getGoalByTagId(tagId);
  if (!existing) return;

  getDb().runSync('DELETE FROM tag_daily_goals WHERE user_id = ? AND tag_id = ?', [userId, tagId]);
  enqueueSync('goal', existing.id, 'delete', {
    id: existing.id,
    user_id: userId,
    tag_id: tagId,
  });
}

export function upsertGoalFromRemote(goal: {
  id: string;
  user_id: string;
  tag_id: string;
  target_minutes: number;
  updated_at: string;
}): void {
  const updatedAt = new Date(goal.updated_at).getTime();
  const existing = getDb().getFirstSync<{ updated_at: number }>(
    'SELECT updated_at FROM tag_daily_goals WHERE user_id = ? AND tag_id = ?',
    [goal.user_id, goal.tag_id],
  );
  if (existing && existing.updated_at >= updatedAt) return;

  getDb().runSync(
    `INSERT INTO tag_daily_goals (id, user_id, tag_id, target_minutes, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, tag_id) DO UPDATE SET
       id = excluded.id,
       target_minutes = excluded.target_minutes,
       updated_at = excluded.updated_at`,
    [goal.id, goal.user_id, goal.tag_id, goal.target_minutes, updatedAt],
  );
}

export function deleteGoalLocally(id: string): void {
  getDb().runSync('DELETE FROM tag_daily_goals WHERE id = ? AND user_id = ?', [
    id,
    requireUserId(),
  ]);
}

function rowToDailyGoalScore(row: {
  id: string;
  date_key: string;
  score_percent: number;
}): DailyGoalScore {
  return {
    id: row.id,
    dateKey: row.date_key,
    scorePercent: row.score_percent,
  };
}

export function getDailyGoalScores(): DailyGoalScore[] {
  const userId = requireUserId();
  return getDb()
    .getAllSync<{ id: string; date_key: string; score_percent: number }>(
      'SELECT id, date_key, score_percent FROM daily_goal_scores WHERE user_id = ? ORDER BY date_key DESC',
      [userId],
    )
    .map(rowToDailyGoalScore);
}

export function getDailyGoalScoreByDateKey(dateKey: string): DailyGoalScore | null {
  const userId = requireUserId();
  const row = getDb().getFirstSync<{ id: string; date_key: string; score_percent: number }>(
    'SELECT id, date_key, score_percent FROM daily_goal_scores WHERE user_id = ? AND date_key = ?',
    [userId, dateKey],
  );
  return row ? rowToDailyGoalScore(row) : null;
}

export function saveDailyGoalScore(dateKey: string, scorePercent: number): DailyGoalScore {
  const userId = requireUserId();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error('Invalid date key');
  }
  if (!Number.isInteger(scorePercent) || scorePercent < 0) {
    throw new Error('Invalid score');
  }

  const ts = nowMs();
  const existing = getDailyGoalScoreByDateKey(dateKey);
  const id = existing?.id ?? createId();

  getDb().runSync(
    `INSERT INTO daily_goal_scores (id, user_id, date_key, score_percent, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date_key) DO UPDATE SET
       score_percent = excluded.score_percent,
       updated_at = excluded.updated_at`,
    [id, userId, dateKey, scorePercent, ts],
  );

  enqueueSync('daily_score', id, 'upsert', {
    id,
    user_id: userId,
    date_key: dateKey,
    score_percent: scorePercent,
    updated_at: new Date(ts).toISOString(),
  });

  const saved = getDailyGoalScoreByDateKey(dateKey);
  if (!saved) throw new Error('Failed to save daily goal score');
  return saved;
}

export function upsertDailyGoalScoreFromRemote(score: {
  id: string;
  user_id: string;
  date_key: string;
  score_percent: number;
  updated_at: string;
}): void {
  const updatedAt = new Date(score.updated_at).getTime();
  const existing = getDb().getFirstSync<{ updated_at: number }>(
    'SELECT updated_at FROM daily_goal_scores WHERE user_id = ? AND date_key = ?',
    [score.user_id, score.date_key],
  );
  if (existing && existing.updated_at >= updatedAt) return;

  getDb().runSync(
    `INSERT INTO daily_goal_scores (id, user_id, date_key, score_percent, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date_key) DO UPDATE SET
       id = excluded.id,
       score_percent = excluded.score_percent,
       updated_at = excluded.updated_at`,
    [score.id, score.user_id, score.date_key, score.score_percent, updatedAt],
  );
}

export function hasPendingSync(): boolean {
  const row = getDb().getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue');
  return (row?.count ?? 0) > 0;
}
