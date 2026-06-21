import { addDays, addWeeks, endOfDay, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';

import { getPeriodBounds } from '@/utils/periodBounds';
import type { Geofence, PeriodType, StatsSummary, TagDuration, TimeEntry } from '@/types';

function clipDuration(startMs: number, endMs: number, rangeStart: number, rangeEnd: number): number {
  const clippedStart = Math.max(startMs, rangeStart);
  const clippedEnd = Math.min(endMs, rangeEnd);
  return Math.max(0, clippedEnd - clippedStart);
}

function aggregateByTag(
  entries: TimeEntry[],
  rangeStart: number,
  rangeEnd: number,
): TagDuration[] {
  const totals = new Map<string, TagDuration>();

  for (const entry of entries) {
    const duration = clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd);
    if (duration <= 0 || entry.tags.length === 0) continue;

    const share = duration / entry.tags.length;
    for (const tag of entry.tags) {
      const existing = totals.get(tag.id);
      if (existing) existing.durationMs += share;
      else totals.set(tag.id, { tag, durationMs: share });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.durationMs - a.durationMs);
}

function aggregateByGeofence(
  entries: TimeEntry[],
  geofences: Geofence[],
  rangeStart: number,
  rangeEnd: number,
) {
  const names = new Map(geofences.map((g) => [g.id, g.name]));
  const totals = new Map<string, { geofenceId: string; name: string; durationMs: number }>();

  for (const entry of entries) {
    if (!entry.geofenceId) continue;
    const duration = clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd);
    if (duration <= 0) continue;

    const existing = totals.get(entry.geofenceId);
    if (existing) existing.durationMs += duration;
    else {
      totals.set(entry.geofenceId, {
        geofenceId: entry.geofenceId,
        name: names.get(entry.geofenceId) ?? 'Unknown place',
        durationMs: duration,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.durationMs - a.durationMs);
}

function buildDayBuckets(anchor: Date, entries: TimeEntry[]) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const buckets = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    let durationMs = 0;

    for (const entry of entries) {
      durationMs += clipDuration(entry.startedAt, entry.endedAt, dayStart, dayEnd);
    }

    buckets.push({ label: format(day, 'EEE'), startMs: dayStart, endMs: dayEnd, durationMs });
  }

  return buckets;
}

function buildWeekBuckets(anchor: Date, entries: TimeEntry[]) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const buckets = [];
  let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  while (weekStart.getMonth() === anchor.getMonth() || weekStart <= anchor) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const bucketStart = weekStart.getTime();
    const bucketEnd = weekEnd.getTime();
    let durationMs = 0;

    for (const entry of entries) {
      durationMs += clipDuration(entry.startedAt, entry.endedAt, bucketStart, bucketEnd);
    }

    buckets.push({
      label: `W${format(weekStart, 'd')}`,
      startMs: bucketStart,
      endMs: bucketEnd,
      durationMs,
    });

    weekStart = addWeeks(weekStart, 1);
    if (buckets.length >= 6) break;
  }

  return buckets;
}

export function getStatsSummary(
  anchor: Date,
  period: PeriodType,
  entries: TimeEntry[],
  geofences: Geofence[],
): StatsSummary {
  const { start, end } = getPeriodBounds(anchor, period);
  const rangeStart = start.getTime();
  const rangeEnd = end.getTime();
  const filtered = entries.filter(
    (entry) => entry.endedAt > rangeStart && entry.startedAt < rangeEnd,
  );
  const byTag = aggregateByTag(filtered, rangeStart, rangeEnd);
  const byGeofence = aggregateByGeofence(filtered, geofences, rangeStart, rangeEnd);
  const totalMs = filtered.reduce(
    (sum, entry) => sum + clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
    0,
  );

  const buckets =
    period === 'week'
      ? buildDayBuckets(anchor, filtered)
      : period === 'month'
        ? buildWeekBuckets(anchor, filtered)
        : [{ label: format(anchor, 'EEE'), startMs: rangeStart, endMs: rangeEnd, durationMs: totalMs }];

  return {
    totalMs,
    entryCount: filtered.length,
    topTag: byTag[0]?.tag ?? null,
    byTag,
    byGeofence,
    buckets,
  };
}
