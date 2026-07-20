import type { StatsSummary } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

export function toChartMinutes(durationMs: number): number {
  return Math.max(0, Math.round(durationMs / 60000));
}

/** Chart Y-axis ticks are in minutes — show as 45m, 1h 30m, etc. */
export function formatChartYLabel(label: string): string {
  const minutes = Number(label);
  if (!Number.isFinite(minutes)) return label;

  const safe = Math.max(0, Math.round(minutes));
  if (safe === 0) return '0';
  return formatDurationLong(safe * 60000);
}

export function chartYAxisTicks(maxMs: number, sections = 4): number[] {
  const safeMax = Math.max(maxMs, 1);
  return Array.from({ length: sections + 1 }, (_, index) => (safeMax / sections) * index);
}

export function hasTagData(summary: StatsSummary): boolean {
  return summary.byTag.length > 0;
}

export function hasBucketData(summary: StatsSummary): boolean {
  return summary.buckets.some((bucket) => bucket.durationMs > 0);
}

export function buildTagBarData(summary: StatsSummary) {
  return summary.byTag.map((item) => ({
    value: Math.max(1, toChartMinutes(item.durationMs)),
    label: formatTagName(item.tag.name),
    frontColor: item.tag.color,
  }));
}

export function buildBucketLineData(summary: StatsSummary) {
  return summary.buckets.map((bucket) => ({
    value: toChartMinutes(bucket.durationMs),
    label: bucket.label,
    durationMs: bucket.durationMs,
    dataPointText: formatDurationLong(bucket.durationMs),
  }));
}

export function buildPieData(summary: StatsSummary) {
  return summary.byTag.map((item) => ({
    value: Math.max(1, toChartMinutes(item.durationMs)),
    color: item.tag.color,
    durationMs: item.durationMs,
  }));
}

export function buildStackData(summary: StatsSummary) {
  return summary.bucketTagBreakdown.map((bucket) => ({
    label: bucket.label,
    totalMs: bucket.totalMs,
    stacks: bucket.byTag
      .map((slice) => ({
        value: toChartMinutes(slice.durationMs),
        durationMs: slice.durationMs,
        color: slice.tag.color,
      }))
      .filter((stack) => stack.value > 0),
  }));
}
