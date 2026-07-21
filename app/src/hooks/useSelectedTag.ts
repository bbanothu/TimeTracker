import { useCallback, useEffect, useRef, useState } from 'react';

import { filterDisplayTags } from '@/constants/defaultPlace';
import { useFlatTagsByUsage } from '@/hooks/useFlatTagsByUsage';
import { getLastSelectedTagId, setLastSelectedTagId } from '@/lib/lastSelectedTag';
import type { Tag } from '@/types';
import { analyticsIncludedTags } from '@/utils/tagAnalytics';

function pickDefaultTagId(tags: Tag[], flatTagIds: string[]): string | null {
  if (tags.length === 0) return null;
  for (const id of flatTagIds) {
    if (tags.some((tag) => tag.id === id)) return id;
  }
  return tags[0].id;
}

export function useSelectedTag(tags: Tag[]) {
  const displayTags = analyticsIncludedTags(filterDisplayTags(tags));
  const flatTags = useFlatTagsByUsage(displayTags);
  const flatTagIds = flatTags.map((item) => item.tag.id);
  const flatTagIdsKey = flatTagIds.join('\0');
  const [selectedTagId, setSelectedTagIdState] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const storedId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLastSelectedTagId()
      .then((id) => {
        if (cancelled) return;
        storedId.current = id;
      })
      .finally(() => {
        if (!cancelled) setStorageReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    if (displayTags.length === 0) {
      setSelectedTagIdState(null);
      return;
    }

    setSelectedTagIdState((current) => {
      if (current && displayTags.some((tag) => tag.id === current)) {
        return current;
      }

      const stored = storedId.current;
      if (stored && displayTags.some((tag) => tag.id === stored)) {
        return stored;
      }

      return pickDefaultTagId(displayTags, flatTagIds);
    });
  }, [storageReady, displayTags, flatTagIdsKey]);

  const setSelectedTagId = useCallback((tagId: string) => {
    storedId.current = tagId;
    setSelectedTagIdState(tagId);
    setLastSelectedTagId(tagId).catch(() => undefined);
  }, []);

  return { selectedTagId, setSelectedTagId };
}
