import type { ActiveSession, Tag, TimeEntry } from '@/types';
import { analyticsIncludedTags } from '@/utils/tagAnalytics';

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

export function getRootTagId(tagId: string, tags: Tag[]): string {
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  let current = byId.get(tagId);
  if (!current) return tagId;

  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }

  return current.id;
}

export function computeCategoryDurationsToday(
  entries: TimeEntry[],
  tags: Tag[],
  dayStart: number,
  dayEnd: number,
  activeSessions: ActiveSession[] = [],
  nowMs: number = Date.now(),
): Map<string, number> {
  const totals = new Map<string, number>();
  const allEntries = [...entries];

  for (const activeSession of activeSessions) {
    if (activeSession.startedAt > dayEnd) continue;
    allEntries.push({
      id: `__active__-${activeSession.id}`,
      startedAt: activeSession.startedAt,
      endedAt: nowMs,
      source: activeSession.source,
      geofenceId: activeSession.geofenceId,
      stopLatitude: null,
      stopLongitude: null,
      details: null,
      tags: activeSession.tags,
    });
  }

  for (const entry of allEntries) {
    const duration = clipDuration(entry.startedAt, entry.endedAt, dayStart, dayEnd);
    const includedTags = analyticsIncludedTags(entry.tags);
    if (duration <= 0 || includedTags.length === 0) continue;

    const share = duration / includedTags.length;
    for (const tag of includedTags) {
      const rootId = getRootTagId(tag.id, tags);
      totals.set(rootId, (totals.get(rootId) ?? 0) + share);
    }
  }

  return totals;
}
