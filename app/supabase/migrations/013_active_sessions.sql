-- Active sessions are in-progress time entries (ended_at IS NULL).
-- A session is created on start and completed when ended_at is set on stop.

ALTER TABLE time_entries ALTER COLUMN ended_at DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_active
  ON time_entries (user_id)
  WHERE ended_at IS NULL;
