import type { ActiveSession, Tag, TimeEntry } from '@/types';
import { analyticsIncludedTags, isTagIncludedInAnalytics } from '@/utils/tagAnalytics';

function resolveSessionTags(session: ActiveSession, tags: Tag[]): Tag[] {
  return session.tagIds
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => tag !== undefined);
}

function resolveEntryTags(entry: TimeEntry, tags: Tag[]): Tag[] {
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  return entry.tags
    .map((tag) => byId.get(tag.id) ?? tag)
    .filter((tag): tag is Tag => tag !== undefined);
}

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
      tags: resolveSessionTags(activeSession, tags),
    });
  }

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  for (const entry of allEntries) {
    if (entry.endedAt == null) continue;
    const duration = clipDuration(entry.startedAt, entry.endedAt, dayStart, dayEnd);
    const includedTags = analyticsIncludedTags(resolveEntryTags(entry, tags));
    if (duration <= 0 || includedTags.length === 0) continue;

    const share = duration / includedTags.length;
    for (const tag of includedTags) {
      const rootId = getRootTagId(tag.id, tags);
      const rootTag = tagById.get(rootId);
      if (rootTag && !isTagIncludedInAnalytics(rootTag)) continue;
      totals.set(rootId, (totals.get(rootId) ?? 0) + share);
    }
  }

  return totals;
}

export const MAX_ACCOUNTED_DAY_MS = 24 * 60 * 60 * 1000;

export function sumAccountedDurationMs(progressByTagId: Map<string, number>, tags: Tag[]): number {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  let total = 0;
  for (const [tagId, ms] of progressByTagId) {
    const tag = tagById.get(tagId);
    if (!tag || !isTagIncludedInAnalytics(tag)) continue;
    total += ms;
  }
  return Math.min(total, MAX_ACCOUNTED_DAY_MS);
}
