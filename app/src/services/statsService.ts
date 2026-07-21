import { addDays, endOfDay, format, startOfDay } from 'date-fns';

import { getPeriodBounds, ROLLING_MONTH_DAYS, ROLLING_WEEK_DAYS } from '@/utils/periodBounds';
import {
  analyticsIncludedTags,
  analyticsVisibleDurationMs,
  isAnalyticsVisibleItem,
} from '@/utils/tagAnalytics';
import type {
  Geofence,
  GeofenceDuration,
  PeriodType,
  StatsSummary,
  Tag,
  TagDuration,
  TimeEntry,
  BucketDuration,
  BucketTagBreakdown,
} from '@/types';

function clipDuration(
  startMs: number,
  endMs: number,
  rangeStart: number,
  rangeEnd: number,
): number {
  const clippedStart = Math.max(startMs, rangeStart);
  const clippedEnd = Math.min(endMs, rangeEnd);
  return Math.max(0, clippedEnd - clippedStart);
}

function aggregateByTag(entries: TimeEntry[], rangeStart: number, rangeEnd: number): TagDuration[] {
  const totals = new Map<string, TagDuration>();

  for (const entry of entries) {
    if (entry.endedAt == null) continue;
    const duration = clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd);
    const includedTags = analyticsIncludedTags(entry.tags);
    if (duration <= 0 || includedTags.length === 0) continue;

    const share = duration / includedTags.length;
    for (const tag of includedTags) {
      const existing = totals.get(tag.id);
      if (existing) {
        existing.durationMs += share;
      } else {
        totals.set(tag.id, { tag, durationMs: share });
      }
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.durationMs - a.durationMs);
}

function aggregateByGeofence(
  entries: TimeEntry[],
  geofences: Geofence[],
  rangeStart: number,
  rangeEnd: number,
): GeofenceDuration[] {
  const names = new Map(geofences.map((g) => [g.id, g.name]));
  const totals = new Map<string, GeofenceDuration>();

  for (const entry of entries) {
    if (!entry.geofenceId || entry.endedAt == null) continue;
    const duration = analyticsVisibleDurationMs(
      clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
      entry.tags,
    );
    if (duration <= 0) continue;

    const existing = totals.get(entry.geofenceId);
    if (existing) {
      existing.durationMs += duration;
      continue;
    }

    totals.set(entry.geofenceId, {
      geofenceId: entry.geofenceId,
      name: names.get(entry.geofenceId) ?? 'Unknown place',
      durationMs: duration,
    });
  }

  return Array.from(totals.values()).sort((a, b) => b.durationMs - a.durationMs);
}

function buildRollingDayBuckets(
  rangeStart: Date,
  dayCount: number,
  entries: TimeEntry[],
  labelForDay: (day: Date) => string,
) {
  const buckets = [];

  for (let i = 0; i < dayCount; i++) {
    const day = addDays(startOfDay(rangeStart), i);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    let durationMs = 0;

    for (const entry of entries) {
      if (entry.endedAt == null) continue;
      durationMs += analyticsVisibleDurationMs(
        clipDuration(entry.startedAt, entry.endedAt, dayStart, dayEnd),
        entry.tags,
      );
    }

    buckets.push({
      label: labelForDay(day),
      startMs: dayStart,
      endMs: dayEnd,
      durationMs,
    });
  }

  return buckets;
}

function buildBucketTagBreakdown(
  buckets: BucketDuration[],
  entries: TimeEntry[],
): BucketTagBreakdown[] {
  return buckets.map((bucket) => {
    const tagTotals = new Map<string, { tag: Tag; durationMs: number }>();

    for (const entry of entries) {
      if (entry.endedAt == null) continue;
      const duration = clipDuration(entry.startedAt, entry.endedAt, bucket.startMs, bucket.endMs);
      const includedTags = analyticsIncludedTags(entry.tags);
      if (duration <= 0 || includedTags.length === 0) continue;

      const share = duration / includedTags.length;
      for (const tag of includedTags) {
        const existing = tagTotals.get(tag.id);
        if (existing) {
          existing.durationMs += share;
        } else {
          tagTotals.set(tag.id, { tag, durationMs: share });
        }
      }
    }

    return {
      label: bucket.label,
      startMs: bucket.startMs,
      endMs: bucket.endMs,
      totalMs: bucket.durationMs,
      byTag: Array.from(tagTotals.values()).sort((a, b) => b.durationMs - a.durationMs),
    };
  });
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
    (entry) =>
      entry.endedAt != null &&
      entry.endedAt > rangeStart &&
      entry.startedAt < rangeEnd &&
      isAnalyticsVisibleItem(entry),
  );
  const byTag = aggregateByTag(filtered, rangeStart, rangeEnd);
  const byGeofence = aggregateByGeofence(filtered, geofences, rangeStart, rangeEnd);
  const totalMs = filtered.reduce((sum, entry) => {
    if (entry.endedAt == null) return sum;
    return (
      sum +
      analyticsVisibleDurationMs(
        clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
        entry.tags,
      )
    );
  }, 0);
  const topTag: Tag | null = byTag[0]?.tag ?? null;

  const buckets =
    period === 'week'
      ? buildRollingDayBuckets(start, ROLLING_WEEK_DAYS, filtered, (day) => format(day, 'EEE'))
      : period === 'month'
        ? buildRollingDayBuckets(start, ROLLING_MONTH_DAYS, filtered, (day) => format(day, 'M/d'))
        : [
            {
              label: format(anchor, 'EEE'),
              startMs: rangeStart,
              endMs: rangeEnd,
              durationMs: totalMs,
            },
          ];

  return {
    totalMs,
    entryCount: filtered.length,
    topTag,
    byTag,
    byGeofence,
    buckets,
    bucketTagBreakdown: buildBucketTagBreakdown(buckets, filtered),
  };
}

export const statsService = { getStatsSummary };
