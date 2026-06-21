import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createTag, deleteTag, getAllTags, updateTag } from '@/db/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSession } from '@/hooks/useActiveSession';
import { syncService } from '@/services/syncService';
import type { Tag } from '@/types';

interface TagsContextValue {
  tags: Tag[];
  refresh: () => void;
  addTag: (name: string, color: string, parentId?: string | null) => void;
  editTag: (id: string, name: string, color: string, parentId?: string | null) => void;
  removeTag: (id: string) => void;
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

  const syncAfterMutation = useCallback(() => {
    refresh();
    if (user) {
      syncService.push(user.id).catch(console.warn);
    }
  }, [refresh, user]);

  const addTag = useCallback(
    (name: string, color: string, parentId: string | null = null) => {
      createTag(name, color, parentId);
      syncAfterMutation();
    },
    [syncAfterMutation],
  );

  const editTag = useCallback(
    (id: string, name: string, color: string, parentId?: string | null) => {
      updateTag(id, name, color, parentId);
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

  const value = useMemo(
    () => ({ tags, refresh, addTag, editTag, removeTag }),
    [tags, refresh, addTag, editTag, removeTag],
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
