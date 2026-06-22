import { useCallback, useEffect, useState } from 'react';

import { getGoals, removeGoal, setGoal } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { TagDailyGoal } from '@/types';

export function useGoals() {
  const { user } = useAuth();
  const { ready } = useActiveSession();
  const [goals, setGoals] = useState<TagDailyGoal[]>([]);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    if (!ready) return;
    setGoals(getGoals());
  }, [ready]);

  useEffect(() => {
    reload();
  }, [reload, revision]);

  useEffect(() => {
    return subscribeDataRefresh(() => setRevision((value) => value + 1));
  }, []);

  const saveGoal = useCallback(
    (tagId: string, targetMinutes: number) => {
      const saved = setGoal(tagId, targetMinutes);
      setGoals((current) => {
        const without = current.filter((goal) => goal.tagId !== tagId);
        return [...without, saved].sort((a, b) => a.tagId.localeCompare(b.tagId));
      });
      pushChangesInBackground(user?.id);
    },
    [user?.id],
  );

  const clearGoal = useCallback(
    (tagId: string) => {
      removeGoal(tagId);
      setGoals((current) => current.filter((goal) => goal.tagId !== tagId));
      pushChangesInBackground(user?.id);
    },
    [user?.id],
  );

  return { goals, ready, saveGoal, clearGoal, reload };
}
