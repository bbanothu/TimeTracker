export type EntrySource = 'manual' | 'geofence';

export interface Tag {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  includeInAnalytics: boolean;
  description: string | null;
}

export interface TagDailyGoal {
  id: string;
  tagId: string;
  targetMinutes: number;
}

export interface DailyGoalScore {
  id: string;
  dateKey: string;
  scorePercent: number;
}

export interface TimeEntry {
  id: string;
  startedAt: number;
  endedAt: number | null;
  source: EntrySource;
  geofenceId: string | null;
  stopLatitude: number | null;
  stopLongitude: number | null;
  details: string | null;
  tags: Tag[];
}

export interface ActiveSession {
  id: string;
  startedAt: number;
  source: EntrySource;
  geofenceId: string | null;
  alarmAt: number | null;
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

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface FriendshipOtherUser {
  userId: string;
  email: string;
  displayName: string | null;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  otherUser: FriendshipOtherUser;
}

export type PeriodType = 'day' | 'week' | 'month';

export type StatsVisualization = 'overview' | 'list' | 'stacked' | 'history' | 'trend';

export interface TagDuration {
  tag: Tag;
  durationMs: number;
}

export interface TagBucketSlice {
  tag: Tag;
  durationMs: number;
}

export interface BucketTagBreakdown {
  label: string;
  startMs: number;
  endMs: number;
  totalMs: number;
  byTag: TagBucketSlice[];
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
  bucketTagBreakdown: BucketTagBreakdown[];
}
