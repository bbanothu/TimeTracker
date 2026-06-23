export function defaultManualEntryTimes(): { startAt: Date; endAt: Date } {
  const endAt = new Date();
  endAt.setSeconds(0, 0);
  const startAt = new Date(endAt.getTime() - 60 * 60 * 1000);
  return { startAt, endAt };
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocalValue(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
