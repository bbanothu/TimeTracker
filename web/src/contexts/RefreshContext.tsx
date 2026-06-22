import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useGoals } from '@/contexts/GoalsContext';
import { useProfilePhoto } from '@/contexts/ProfilePhotoContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { notifyDataRefresh } from '@/lib/dataRefresh';

interface RefreshContextValue {
  refreshing: boolean;
  refreshAll: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshGoals } = useGoals();
  const { refresh: refreshTags } = useTags();
  const { refresh: refreshTimer } = useTimer();
  const { refresh: refreshPhoto } = useProfilePhoto();
  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshTags(), refreshGoals(), refreshTimer(), refreshPhoto()]);
      notifyDataRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshTags, refreshGoals, refreshTimer, refreshPhoto]);

  const value = useMemo(
    () => ({ refreshing, refreshAll }),
    [refreshing, refreshAll],
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) throw new Error('useRefresh must be used within RefreshProvider');
  return context;
}
