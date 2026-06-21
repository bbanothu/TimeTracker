import { addDays, addWeeks, endOfDay, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';

import { getEntriesBetween } from '@/db/client';
import { getPeriodBounds } from '@/utils/periodBounds';
import type { PeriodType, StatsSummary, Tag, TagDuration, BucketDuration, BucketTagBreakdown } from '@/types';

function clipDuration(startMs: number, endMs: number, rangeStart: number, rangeEnd: number): number {
  const clippedStart = Math.max(startMs, rangeStart);
  const clippedEnd = Math.min(endMs, rangeEnd);
  return Math.max(0, clippedEnd - clippedStart);
}

function aggregateByTag(
  entries: ReturnType<typeof getEntriesBetween>,
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
      if (existing) {
        existing.durationMs += share;
      } else {
        totals.set(tag.id, { tag, durationMs: share });
      }
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.durationMs - a.durationMs);
}

function buildDayBuckets(
  anchor: Date,
  entries: ReturnType<typeof getEntriesBetween>,
  rangeStart: number,
  rangeEnd: number,
) {
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

    buckets.push({
      label: format(day, 'EEE'),
      startMs: dayStart,
      endMs: dayEnd,
      durationMs,
    });
  }

  return buckets;
}

function buildWeekBuckets(
  anchor: Date,
  entries: ReturnType<typeof getEntriesBetween>,
) {
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

function buildBucketTagBreakdown(
  buckets: BucketDuration[],
  entries: ReturnType<typeof getEntriesBetween>,
): BucketTagBreakdown[] {
  return buckets.map((bucket) => {
    const tagTotals = new Map<string, { tag: Tag; durationMs: number }>();

    for (const entry of entries) {
      const duration = clipDuration(entry.startedAt, entry.endedAt, bucket.startMs, bucket.endMs);
      if (duration <= 0 || entry.tags.length === 0) continue;

      const share = duration / entry.tags.length;
      for (const tag of entry.tags) {
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

export function getStatsSummary(anchor: Date, period: PeriodType): StatsSummary {
  const { start, end } = getPeriodBounds(anchor, period);
  const rangeStart = start.getTime();
  const rangeEnd = end.getTime();
  const entries = getEntriesBetween(rangeStart, rangeEnd);
  const byTag = aggregateByTag(entries, rangeStart, rangeEnd);
  const totalMs = entries.reduce(
    (sum, entry) => sum + clipDuration(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
    0,
  );
  const topTag: Tag | null = byTag[0]?.tag ?? null;

  const buckets =
    period === 'week'
      ? buildDayBuckets(anchor, entries, rangeStart, rangeEnd)
      : period === 'month'
        ? buildWeekBuckets(anchor, entries)
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
    entryCount: entries.length,
    topTag,
    byTag,
    buckets,
    bucketTagBreakdown: buildBucketTagBreakdown(buckets, entries),
  };
}

export const statsService = { getStatsSummary };
