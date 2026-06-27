export const SCHEMA_VERSION = 9;

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_id TEXT,
  include_in_analytics INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_entries (
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

CREATE TABLE IF NOT EXISTS time_entry_tags (
  entry_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (entry_id, tag_id),
  FOREIGN KEY (entry_id) REFERENCES time_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS geofences (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 150,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS active_session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  geofence_id TEXT
);

CREATE TABLE IF NOT EXISTS active_session_tags (
  session_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (session_id, tag_id),
  FOREIGN KEY (session_id) REFERENCES active_session(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_state (
  user_id TEXT PRIMARY KEY NOT NULL,
  last_pulled_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_daily_goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  target_minutes INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS daily_goal_scores (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  date_key TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, date_key)
);
`;

export const DEFAULT_TAGS = [
  { name: 'work', color: '#059669' },
  { name: 'personal', color: '#10B981' },
  { name: 'sleep', color: '#8B5CF6' },
] as const;

export type SyncEntityType = 'tag' | 'entry' | 'geofence' | 'goal' | 'daily_score';
export type SyncOperation = 'upsert' | 'delete';

export const TAGS_V3_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_parent_name
  ON tags(user_id, COALESCE(parent_id, ''), name);
`;
