-- Stop location and optional session notes on time entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS stop_latitude DOUBLE PRECISION;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS stop_longitude DOUBLE PRECISION;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS details TEXT;
