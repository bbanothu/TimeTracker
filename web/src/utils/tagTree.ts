import type { Tag } from '@/types';

export interface FlatTagItem {
  tag: Tag;
  depth: number;
  path: string;
}

export function getTagPath(tagId: string, tags: Tag[]): string {
  const byId = new Map(tags.map((t) => [t.id, t]));
  const parts: string[] = [];
  let current = byId.get(tagId);

  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return parts.join(' › ');
}

export function flattenTags(tags: Tag[]): FlatTagItem[] {
  const childrenByParent = new Map<string | null, Tag[]>();

  for (const tag of tags) {
    const key = tag.parentId;
    const siblings = childrenByParent.get(key) ?? [];
    siblings.push(tag);
    childrenByParent.set(key, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const result: FlatTagItem[] = [];

  function walk(parentId: string | null, depth: number, prefix: string[]) {
    for (const tag of childrenByParent.get(parentId) ?? []) {
      const pathParts = [...prefix, tag.name];
      result.push({ tag, depth, path: pathParts.join(' › ') });
      walk(tag.id, depth + 1, pathParts);
    }
  }

  walk(null, 0, []);
  return result;
}

export function getEligibleParents(editingTagId: string | null, tags: Tag[]): FlatTagItem[] {
  const getDescendants = (tagId: string): Set<string> => {
    const descendants = new Set<string>();
    const childrenByParent = new Map<string, Tag[]>();
    for (const tag of tags) {
      if (!tag.parentId) continue;
      const siblings = childrenByParent.get(tag.parentId) ?? [];
      siblings.push(tag);
      childrenByParent.set(tag.parentId, siblings);
    }
    const stack = [tagId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const child of childrenByParent.get(id) ?? []) {
        descendants.add(child.id);
        stack.push(child.id);
      }
    }
    return descendants;
  };

  const excluded = editingTagId
    ? new Set([editingTagId, ...getDescendants(editingTagId)])
    : new Set<string>();

  return flattenTags(tags).filter((item) => !excluded.has(item.tag.id));
}

export function wouldCreateCycle(tagId: string, newParentId: string | null, tags: Tag[]): boolean {
  if (!newParentId) return false;
  if (newParentId === tagId) return true;
  const childrenByParent = new Map<string, Tag[]>();
  for (const tag of tags) {
    if (!tag.parentId) continue;
    const siblings = childrenByParent.get(tag.parentId) ?? [];
    siblings.push(tag);
    childrenByParent.set(tag.parentId, siblings);
  }
  const stack = [tagId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenByParent.get(id) ?? []) {
      if (child.id === newParentId) return true;
      stack.push(child.id);
    }
  }
  return false;
}
