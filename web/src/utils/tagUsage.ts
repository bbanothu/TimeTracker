import type { FlatTagItem } from '@/utils/tagTree';

interface TaggedEntry {
  tags: Array<{ id: string }>;
}

export function buildTagUsageCounts(entries: TaggedEntry[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }

  return counts;
}

export function sortFlatTagsByUsage(
  items: FlatTagItem[],
  usageCounts: Map<string, number>,
): FlatTagItem[] {
  return [...items].sort((a, b) => {
    const usageDiff = (usageCounts.get(b.tag.id) ?? 0) - (usageCounts.get(a.tag.id) ?? 0);
    if (usageDiff !== 0) return usageDiff;
    return a.tag.name.localeCompare(b.tag.name);
  });
}
