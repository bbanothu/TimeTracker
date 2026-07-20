import { addDays, endOfDay, format, startOfDay } from 'date-fns';

import type { Tag, TimeEntry } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';
import { analyticsIncludedTags, analyticsVisibleDurationMs } from '@/utils/tagAnalytics';

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

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',');
}

function exportTagColumns(tags: Tag[]): Tag[] {
  return tags
    .filter((tag) => tag.includeInAnalytics !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAggregatedExportCsv(
  entries: TimeEntry[],
  tags: Tag[],
  personName: string,
): string {
  const tagColumns = exportTagColumns(tags);
  const byDate = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    if (entry.endedAt == null) continue;

    let dayCursor = startOfDay(new Date(entry.startedAt));

    while (dayCursor.getTime() < entry.endedAt) {
      const dayStartMs = dayCursor.getTime();
      const dayEndMs = endOfDay(dayCursor).getTime();
      const clipped = clipDuration(entry.startedAt, entry.endedAt, dayStartMs, dayEndMs);
      const visibleMs = analyticsVisibleDurationMs(clipped, entry.tags);
      const included = analyticsIncludedTags(entry.tags);

      if (visibleMs > 0 && included.length > 0) {
        const date = format(dayCursor, 'yyyy-MM-dd');
        if (!byDate.has(date)) byDate.set(date, new Map());
        const dayTotals = byDate.get(date)!;
        const share = visibleMs / included.length;

        for (const tag of included) {
          dayTotals.set(tag.id, (dayTotals.get(tag.id) ?? 0) + share);
        }
      }

      dayCursor = addDays(dayCursor, 1);
    }
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  const header = formatCsvRow(['date', 'name', ...tagColumns.map((tag) => tag.name)]);
  const rows = sortedDates.map((date) => {
    const dayTotals = byDate.get(date) ?? new Map();
    return formatCsvRow([
      date,
      personName,
      ...tagColumns.map((tag) => formatDurationLong(dayTotals.get(tag.id) ?? 0)),
    ]);
  });

  return [header, ...rows].join('\n');
}

export function aggregatedExportDayCount(entries: TimeEntry[]): number {
  const dates = new Set<string>();

  for (const entry of entries) {
    if (entry.endedAt == null) continue;

    let dayCursor = startOfDay(new Date(entry.startedAt));
    while (dayCursor.getTime() < entry.endedAt) {
      dates.add(format(dayCursor, 'yyyy-MM-dd'));
      dayCursor = addDays(dayCursor, 1);
    }
  }

  return dates.size;
}
