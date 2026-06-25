import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createTag, deleteTag, getAllTags, setTagIncludeInAnalytics, updateTag } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { Tag } from '@/types';

interface TagsContextValue {
  tags: Tag[];
  refresh: () => void;
  addTag: (name: string, color: string, parentId?: string | null, description?: string | null) => void;
  editTag: (
    id: string,
    name: string,
    color: string,
    parentId?: string | null,
    description?: string | null,
  ) => void;
  removeTag: (id: string) => void;
  toggleTagAnalytics: (id: string, includeInAnalytics: boolean) => void;
}

const TagsContext = createContext<TagsContextValue | null>(null);

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { ready } = useActiveSession();
  const [tags, setTags] = useState<Tag[]>([]);

  const refresh = useCallback(() => {
    setTags(getAllTags());
  }, []);

  useEffect(() => {
    if (ready) {
      refresh();
    }
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready) return;
    return subscribeDataRefresh(refresh);
  }, [ready, refresh]);

  const syncAfterMutation = useCallback(() => {
    refresh();
    notifyDataRefresh();
    pushChangesInBackground(user?.id);
  }, [refresh, user?.id]);

  const addTag = useCallback(
    (name: string, color: string, parentId: string | null = null, description: string | null = null) => {
      createTag(name, color, parentId, description);
      syncAfterMutation();
    },
    [syncAfterMutation],
  );

  const editTag = useCallback(
    (
      id: string,
      name: string,
      color: string,
      parentId?: string | null,
      description?: string | null,
    ) => {
      updateTag(id, name, color, parentId, description);
      syncAfterMutation();
    },
    [syncAfterMutation],
  );

  const removeTag = useCallback(
    (id: string) => {
      deleteTag(id);
      syncAfterMutation();
    },
    [syncAfterMutation],
  );

  const toggleTagAnalytics = useCallback(
    (id: string, includeInAnalytics: boolean) => {
      setTagIncludeInAnalytics(id, includeInAnalytics);
      syncAfterMutation();
    },
    [syncAfterMutation],
  );

  const value = useMemo(
    () => ({ tags, refresh, addTag, editTag, removeTag, toggleTagAnalytics }),
    [tags, refresh, addTag, editTag, removeTag, toggleTagAnalytics],
  );

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags() {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTags must be used within TagsProvider');
  }
  return context;
}
