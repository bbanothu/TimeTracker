import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { PeriodType } from '@/types';

export function getPeriodBounds(date: Date, period: PeriodType): { start: Date; end: Date } {
  switch (period) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
}

export function shiftPeriod(date: Date, period: PeriodType, delta: number): Date {
  switch (period) {
    case 'day':
      return addDays(date, delta);
    case 'week':
      return addWeeks(date, delta);
    case 'month':
      return addMonths(date, delta);
  }
}

export function formatPeriodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case 'day':
      return format(date, 'EEE, MMM d, yyyy');
    case 'week': {
      const { start, end } = getPeriodBounds(date, 'week');
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    case 'month':
      return format(date, 'MMMM yyyy');
  }
}
