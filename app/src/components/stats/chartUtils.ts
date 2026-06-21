import { formatTagName } from '@/utils/formatDuration';
import type { StatsSummary } from '@/types';

export function toChartMinutes(durationMs: number): number {
  return Math.max(0, Math.round(durationMs / 60000));
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
  }));
}

export function buildPieData(summary: StatsSummary) {
  return summary.byTag.map((item) => ({
    value: Math.max(1, toChartMinutes(item.durationMs)),
    color: item.tag.color,
    text: formatTagName(item.tag.name),
  }));
}

export function buildStackData(summary: StatsSummary) {
  return summary.bucketTagBreakdown.map((bucket) => ({
    label: bucket.label,
    stacks: bucket.byTag
      .map((slice) => ({
        value: toChartMinutes(slice.durationMs),
        color: slice.tag.color,
      }))
      .filter((stack) => stack.value > 0),
  }));
}
