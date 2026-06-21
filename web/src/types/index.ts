export type EntrySource = 'manual' | 'geofence';

export interface Tag {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export interface TimeEntry {
  id: string;
  startedAt: number;
  endedAt: number;
  source: EntrySource;
  geofenceId: string | null;
  tags: Tag[];
}

export interface ActiveSession {
  id: string;
  startedAt: number;
  source: EntrySource;
  geofenceId: string | null;
  tagIds: string[];
}

export interface Geofence {
  id: string;
  tagId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enabled: boolean;
  tag?: Tag;
}

export type PeriodType = 'day' | 'week' | 'month';

export interface TagDuration {
  tag: Tag;
  durationMs: number;
}

export interface GeofenceDuration {
  geofenceId: string;
  name: string;
  durationMs: number;
}

export interface BucketDuration {
  label: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface StatsSummary {
  totalMs: number;
  entryCount: number;
  topTag: Tag | null;
  byTag: TagDuration[];
  byGeofence: GeofenceDuration[];
  buckets: BucketDuration[];
}
