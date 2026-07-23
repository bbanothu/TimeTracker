import type { TimeEntry } from '@/types';
import { distanceMeters } from '@/utils/geo';

export const DEFAULT_LOCATION_PROXIMITY_METERS = 150;
export const DEFAULT_MAX_MERGE_GAP_MS = 15 * 60 * 1000;

export interface MergedEntryFields {
  startedAt: number;
  endedAt: number;
  details: string | null;
  stopLatitude: number | null;
  stopLongitude: number | null;
  geofenceId: string | null;
  source: TimeEntry['source'];
}

export interface MergePair {
  older: TimeEntry;
  newer: TimeEntry;
}

function tagIdsKey(entry: TimeEntry): string {
  return entry.tags
    .map((tag) => tag.id)
    .sort()
    .join(',');
}

export function sameTagSet(a: TimeEntry, b: TimeEntry): boolean {
  const keyA = tagIdsKey(a);
  return keyA.length > 0 && keyA === tagIdsKey(b);
}

function hasStopCoords(entry: TimeEntry): boolean {
  return entry.stopLatitude != null && entry.stopLongitude != null;
}

/** True when locations are compatible for merge (same place, or one side missing). */
export function entriesSameLocation(
  a: TimeEntry,
  b: TimeEntry,
  proximityMeters = DEFAULT_LOCATION_PROXIMITY_METERS,
): boolean {
  if (a.geofenceId && b.geofenceId) {
    return a.geofenceId === b.geofenceId;
  }

  // One named place + one without: allow; merge will keep the place.
  if (a.geofenceId || b.geofenceId) {
    return true;
  }

  const aHasCoords = hasStopCoords(a);
  const bHasCoords = hasStopCoords(b);

  if (aHasCoords && bHasCoords) {
    return (
      distanceMeters(a.stopLatitude!, a.stopLongitude!, b.stopLatitude!, b.stopLongitude!) <=
      proximityMeters
    );
  }

  // Missing coords on one side should not block merge.
  return true;
}

/** Prefer the entry that carries a place / stop coordinates. */
export function preferLocationEntry(a: TimeEntry, b: TimeEntry): TimeEntry {
  if (a.geofenceId && !b.geofenceId) return a;
  if (b.geofenceId && !a.geofenceId) return b;
  if (hasStopCoords(a) && !hasStopCoords(b)) return a;
  if (hasStopCoords(b) && !hasStopCoords(a)) return b;
  // Same location richness — keep the later-ending session's stop point.
  return (a.endedAt ?? 0) >= (b.endedAt ?? 0) ? a : b;
}

/** Overlap, containment, or gap within maxGapMs. */
export function areMergeableInTime(
  older: TimeEntry,
  newer: TimeEntry,
  maxGapMs = DEFAULT_MAX_MERGE_GAP_MS,
): boolean {
  if (older.endedAt == null || newer.endedAt == null) return false;

  // Overlap or containment (including identical ranges).
  if (newer.startedAt < older.endedAt) {
    return true;
  }

  return newer.startedAt - older.endedAt <= maxGapMs;
}

/** @deprecated Use areMergeableInTime — kept for call sites that expect the old name. */
export function areConsecutiveInTime(
  older: TimeEntry,
  newer: TimeEntry,
  maxGapMs = DEFAULT_MAX_MERGE_GAP_MS,
): boolean {
  return areMergeableInTime(older, newer, maxGapMs);
}

export function getOlderNewer(
  a: TimeEntry,
  b: TimeEntry,
): { older: TimeEntry; newer: TimeEntry } | null {
  if (a.endedAt == null || b.endedAt == null) return null;
  return a.startedAt <= b.startedAt ? { older: a, newer: b } : { older: b, newer: a };
}

export function canMergeAdjacentEntries(older: TimeEntry, newer: TimeEntry): boolean {
  if (older.endedAt == null || newer.endedAt == null) return false;
  if (!sameTagSet(older, newer)) return false;
  if (!entriesSameLocation(older, newer)) return false;
  return areMergeableInTime(older, newer);
}

/** List is newest-first; pair row `index` with `index + 1`. Pass completed entries only. */
export function getMergePair(entries: TimeEntry[], index: number): MergePair | null {
  const completed = entries.filter((entry) => entry.endedAt != null);
  if (index < 0 || index >= completed.length - 1) return null;

  const first = completed[index];
  const second = completed[index + 1];
  const ordered = getOlderNewer(first, second);
  if (!ordered) return null;
  if (!canMergeAdjacentEntries(ordered.older, ordered.newer)) return null;

  return ordered;
}

export function buildMergedFields(older: TimeEntry, newer: TimeEntry): MergedEntryFields {
  const detailParts = [older.details, newer.details]
    .map((value) => value?.trim())
    .filter((value): value is string => !!value);
  const uniqueDetails = [...new Set(detailParts)];
  const locationSource = preferLocationEntry(older, newer);

  return {
    startedAt: Math.min(older.startedAt, newer.startedAt),
    endedAt: Math.max(older.endedAt!, newer.endedAt!),
    details: uniqueDetails.length > 0 ? uniqueDetails.join(' · ') : null,
    stopLatitude: locationSource.stopLatitude,
    stopLongitude: locationSource.stopLongitude,
    geofenceId: locationSource.geofenceId,
    source: locationSource.geofenceId ? 'geofence' : locationSource.source,
  };
}

export function formatMergePreview(older: TimeEntry, newer: TimeEntry): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const olderStart = new Date(older.startedAt).toLocaleTimeString([], timeOptions);
  const olderEnd = new Date(older.endedAt!).toLocaleTimeString([], timeOptions);
  const newerStart = new Date(newer.startedAt).toLocaleTimeString([], timeOptions);
  const newerEnd = new Date(newer.endedAt!).toLocaleTimeString([], timeOptions);
  const mergedStart = new Date(Math.min(older.startedAt, newer.startedAt)).toLocaleTimeString(
    [],
    timeOptions,
  );
  const mergedEnd = new Date(Math.max(older.endedAt!, newer.endedAt!)).toLocaleTimeString(
    [],
    timeOptions,
  );

  return `${olderStart}–${olderEnd} + ${newerStart}–${newerEnd} → ${mergedStart}–${mergedEnd}`;
}
