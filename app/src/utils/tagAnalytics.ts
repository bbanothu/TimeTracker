import type { Tag } from '@/types';

export function isTagIncludedInAnalytics(tag: Tag): boolean {
  return tag.includeInAnalytics !== false;
}

export function analyticsIncludedTags(tags: Tag[]): Tag[] {
  return tags.filter(isTagIncludedInAnalytics);
}

export function analyticsVisibleDurationMs(durationMs: number, tags: Tag[]): number {
  if (durationMs <= 0 || tags.length === 0) return 0;
  const included = analyticsIncludedTags(tags);
  if (included.length === 0) return 0;
  return durationMs * (included.length / tags.length);
}
