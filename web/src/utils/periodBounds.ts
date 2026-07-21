import { addDays, endOfDay, format, startOfDay } from 'date-fns';

import type { PeriodType } from '@/types';

export const ROLLING_WEEK_DAYS = 7;
export const ROLLING_MONTH_DAYS = 30;

export const PERIOD_LABELS: Record<PeriodType, string> = {
  day: 'Day',
  week: '7 days',
  month: '30 days',
};

export function getPeriodBounds(date: Date, period: PeriodType): { start: Date; end: Date } {
  switch (period) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return {
        start: startOfDay(addDays(date, -(ROLLING_WEEK_DAYS - 1))),
        end: endOfDay(date),
      };
    case 'month':
      return {
        start: startOfDay(addDays(date, -(ROLLING_MONTH_DAYS - 1))),
        end: endOfDay(date),
      };
  }
}

/** Overlap of [startMs, endMs] with [rangeStart, rangeEnd], in milliseconds. */
export function clipDurationMs(
  startMs: number,
  endMs: number,
  rangeStart: number,
  rangeEnd: number,
): number {
  const clippedStart = Math.max(startMs, rangeStart);
  const clippedEnd = Math.min(endMs, rangeEnd);
  return Math.max(0, clippedEnd - clippedStart);
}

export function shiftPeriod(date: Date, period: PeriodType, delta: number): Date {
  switch (period) {
    case 'day':
      return addDays(date, delta);
    case 'week':
      return addDays(date, delta * ROLLING_WEEK_DAYS);
    case 'month':
      return addDays(date, delta * ROLLING_MONTH_DAYS);
  }
}

export function formatPeriodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case 'day':
      return format(date, 'EEE, MMM d, yyyy');
    case 'week':
    case 'month': {
      const { start, end } = getPeriodBounds(date, period);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
  }
}
