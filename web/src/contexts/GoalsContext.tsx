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
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { deleteGoal, fetchGoals, upsertGoal } from '@/services/data';
import type { TagDailyGoal } from '@/types';

interface GoalsContextValue {
  goals: TagDailyGoal[];
  ready: boolean;
  refresh: () => Promise<void>;
  saveGoal: (tagId: string, targetMinutes: number) => Promise<void>;
  clearGoal: (tagId: string) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<TagDailyGoal[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setReady(true);
      return;
    }

    const next = await fetchGoals(user.id);
    setGoals(next);
    setReady(true);
  }, [user]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    return subscribeDataRefresh(() => {
      refresh().catch(console.error);
    });
  }, [refresh]);

  const saveGoal = useCallback(
    async (tagId: string, targetMinutes: number) => {
      if (!user) throw new Error('Sign in to save goals');
      const saved = await upsertGoal(user.id, tagId, targetMinutes);
      setGoals((current) => {
        const without = current.filter((goal) => goal.tagId !== tagId);
        return [...without, saved].sort((a, b) => a.tagId.localeCompare(b.tagId));
      });
    },
    [user],
  );

  const clearGoal = useCallback(
    async (tagId: string) => {
      if (!user) throw new Error('Sign in to save goals');
      await deleteGoal(user.id, tagId);
      setGoals((current) => current.filter((goal) => goal.tagId !== tagId));
    },
    [user],
  );

  const value = useMemo(
    () => ({ goals, ready, refresh, saveGoal, clearGoal }),
    [goals, ready, refresh, saveGoal, clearGoal],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error('useGoals must be used within GoalsProvider');
  return context;
}
