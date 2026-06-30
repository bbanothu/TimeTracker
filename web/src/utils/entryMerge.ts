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

export function entriesSameLocation(
  a: TimeEntry,
  b: TimeEntry,
  proximityMeters = DEFAULT_LOCATION_PROXIMITY_METERS,
): boolean {
  if (a.geofenceId && b.geofenceId) {
    return a.geofenceId === b.geofenceId;
  }
  if (a.geofenceId || b.geofenceId) {
    return false;
  }

  const aHasCoords = a.stopLatitude != null && a.stopLongitude != null;
  const bHasCoords = b.stopLatitude != null && b.stopLongitude != null;

  if (aHasCoords && bHasCoords) {
    return (
      distanceMeters(a.stopLatitude!, a.stopLongitude!, b.stopLatitude!, b.stopLongitude!) <=
      proximityMeters
    );
  }

  // No geofence on either side — missing coords on one entry should not block merge.
  return true;
}

export function areConsecutiveInTime(
  older: TimeEntry,
  newer: TimeEntry,
  maxGapMs = DEFAULT_MAX_MERGE_GAP_MS,
): boolean {
  if (older.endedAt == null || newer.endedAt == null) return false;
  if (newer.startedAt < older.endedAt) return false;
  return newer.startedAt - older.endedAt <= maxGapMs;
}

export function getOlderNewer(a: TimeEntry, b: TimeEntry): { older: TimeEntry; newer: TimeEntry } | null {
  if (a.endedAt == null || b.endedAt == null) return null;
  return a.startedAt <= b.startedAt ? { older: a, newer: b } : { older: b, newer: a };
}

export function canMergeAdjacentEntries(older: TimeEntry, newer: TimeEntry): boolean {
  if (older.endedAt == null || newer.endedAt == null) return false;
  if (!sameTagSet(older, newer)) return false;
  if (!entriesSameLocation(older, newer)) return false;
  return areConsecutiveInTime(older, newer);
}

/** List is newest-first; pair row `index` with `index + 1`. Pass completed entries only. */
export function getMergePair(entries: TimeEntry[], index: number): MergePair | null {
  const completed = entries.filter((entry) => entry.endedAt != null);
  if (index < 0 || index >= completed.length - 1) return null;

  const newer = completed[index];
  const older = completed[index + 1];
  if (!canMergeAdjacentEntries(older, newer)) return null;

  return { older, newer };
}

export function buildMergedFields(older: TimeEntry, newer: TimeEntry): MergedEntryFields {
  const detailParts = [older.details, newer.details]
    .map((value) => value?.trim())
    .filter((value): value is string => !!value);
  const uniqueDetails = [...new Set(detailParts)];

  return {
    startedAt: older.startedAt,
    endedAt: newer.endedAt!,
    details: uniqueDetails.length > 0 ? uniqueDetails.join(' · ') : null,
    stopLatitude: newer.stopLatitude,
    stopLongitude: newer.stopLongitude,
  };
}

export function formatMergePreview(older: TimeEntry, newer: TimeEntry): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const olderEnd = new Date(older.endedAt!).toLocaleTimeString([], timeOptions);
  const newerStart = new Date(newer.startedAt).toLocaleTimeString([], timeOptions);
  const newerEnd = new Date(newer.endedAt!).toLocaleTimeString([], timeOptions);
  const mergedStart = new Date(older.startedAt).toLocaleTimeString([], timeOptions);
  const mergedEnd = newerEnd;

  return `${mergedStart}–${olderEnd} + ${newerStart}–${newerEnd} → ${mergedStart}–${mergedEnd}`;
}
