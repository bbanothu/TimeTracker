import type { Tag } from '@/types';

function storageKey(userId: string): string {
  return `timetracker-tag-analytics-${userId}`;
}

export function loadTagAnalyticsPrefs(userId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveTagAnalyticsPref(userId: string, tagId: string, includeInAnalytics: boolean): void {
  const prefs = loadTagAnalyticsPrefs(userId);
  prefs[tagId] = includeInAnalytics;
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

export function clearTagAnalyticsPref(userId: string, tagId: string): void {
  const prefs = loadTagAnalyticsPrefs(userId);
  delete prefs[tagId];
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

export function applyTagAnalyticsPrefs(userId: string, tags: Tag[]): Tag[] {
  const prefs = loadTagAnalyticsPrefs(userId);
  if (Object.keys(prefs).length === 0) return tags;

  return tags.map((tag) =>
    tag.id in prefs ? { ...tag, includeInAnalytics: prefs[tag.id] } : tag,
  );
}
