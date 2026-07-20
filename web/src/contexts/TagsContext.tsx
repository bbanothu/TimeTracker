import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import {
  createTag,
  deleteTag,
  ensureDefaultUnknownPlace,
  fetchTags,
  seedDefaultTags,
  setTagIncludeInAnalytics,
  updateTag,
} from '@/services/data';
import type { Tag } from '@/types';

interface TagsContextValue {
  tags: Tag[];
  loading: boolean;
  refresh: () => Promise<void>;
  addTag: (
    name: string,
    color: string,
    parentId?: string | null,
    description?: string | null,
  ) => Promise<void>;
  editTag: (
    id: string,
    name: string,
    color: string,
    parentId?: string | null,
    description?: string | null,
  ) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  toggleTagAnalytics: (id: string, includeInAnalytics: boolean) => Promise<void>;
}

const TagsContext = createContext<TagsContextValue | null>(null);

export function TagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await seedDefaultTags(user.id);
      await ensureDefaultUnknownPlace(user.id);
      setTags(await fetchTags(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      refresh().catch(console.error);
    });
  }, [user, refresh]);

  const afterMutation = useCallback(async () => {
    await refresh();
    notifyDataRefresh();
  }, [refresh]);

  const addTag = useCallback(
    async (
      name: string,
      color: string,
      parentId: string | null = null,
      description: string | null = null,
    ) => {
      if (!user) return;
      await createTag(user.id, name, color, parentId, description);
      await afterMutation();
    },
    [user, afterMutation],
  );

  const editTag = useCallback(
    async (
      id: string,
      name: string,
      color: string,
      parentId?: string | null,
      description?: string | null,
    ) => {
      if (!user) return;
      await updateTag(user.id, id, name, color, parentId ?? null, description);
      await afterMutation();
    },
    [user, afterMutation],
  );

  const removeTag = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteTag(user.id, id);
      await afterMutation();
    },
    [user, afterMutation],
  );

  const toggleTagAnalytics = useCallback(
    async (id: string, includeInAnalytics: boolean) => {
      if (!user) return;
      await setTagIncludeInAnalytics(user.id, id, includeInAnalytics);
      await afterMutation();
    },
    [user, afterMutation],
  );

  const value = useMemo(
    () => ({ tags, loading, refresh, addTag, editTag, removeTag, toggleTagAnalytics }),
    [tags, loading, refresh, addTag, editTag, removeTag, toggleTagAnalytics],
  );

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags() {
  const context = useContext(TagsContext);
  if (!context) throw new Error('useTags must be used within TagsProvider');
  return context;
}
