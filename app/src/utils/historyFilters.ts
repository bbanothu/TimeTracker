import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';

import type { EntrySource, TimeEntry } from '@/types';

export type HistoryDatePreset = 'all' | 'today' | 'week' | 'month';

export interface HistoryFilterState {
  datePreset: HistoryDatePreset;
  tagId: string | null;
  source: EntrySource | 'all';
  geofenceId: string | null;
}

export const defaultHistoryFilters: HistoryFilterState = {
  datePreset: 'all',
  tagId: null,
  source: 'all',
  geofenceId: null,
};

const DATE_PRESET_LABELS: Record<HistoryDatePreset, string> = {
  all: 'All time',
  today: 'Today',
  week: 'This week',
  month: 'This month',
};

export function getHistoryDatePresetLabel(preset: HistoryDatePreset): string {
  return DATE_PRESET_LABELS[preset];
}

function getDateRange(preset: HistoryDatePreset, reference = new Date()): { startMs: number; endMs: number } | null {
  if (preset === 'all') return null;

  switch (preset) {
    case 'today':
      return { startMs: startOfDay(reference).getTime(), endMs: endOfDay(reference).getTime() };
    case 'week':
      return {
        startMs: startOfWeek(reference, { weekStartsOn: 1 }).getTime(),
        endMs: endOfWeek(reference, { weekStartsOn: 1 }).getTime(),
      };
    case 'month':
      return {
        startMs: startOfMonth(reference).getTime(),
        endMs: endOfMonth(reference).getTime(),
      };
  }
}

export function filterHistoryEntries(entries: TimeEntry[], filters: HistoryFilterState): TimeEntry[] {
  let result = entries;
  const range = getDateRange(filters.datePreset);

  if (range) {
    result = result.filter(
      (entry) => entry.startedAt <= range.endMs && entry.endedAt >= range.startMs,
    );
  }

  if (filters.tagId) {
    result = result.filter((entry) => entry.tags.some((tag) => tag.id === filters.tagId));
  }

  if (filters.source !== 'all') {
    result = result.filter((entry) => entry.source === filters.source);
  }

  if (filters.geofenceId) {
    result = result.filter((entry) => entry.geofenceId === filters.geofenceId);
  }

  return result;
}

export function hasActiveHistoryFilters(filters: HistoryFilterState): boolean {
  return (
    filters.datePreset !== 'all' ||
    filters.tagId !== null ||
    filters.source !== 'all' ||
    filters.geofenceId !== null
  );
}
