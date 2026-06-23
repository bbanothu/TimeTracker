export function defaultManualEntryTimes(): { startAt: Date; endAt: Date } {
  const endAt = new Date();
  endAt.setSeconds(0, 0);
  const startAt = new Date(endAt.getTime() - 60 * 60 * 1000);
  return { startAt, endAt };
}
