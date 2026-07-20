import { useCallback, useEffect, useState } from 'react';

import { getDailyGoalScores } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { runDailyGoalScoreSnapshot } from '@/services/dailyGoalScoreService';
import type { DailyGoalScore } from '@/types';

export function useDailyGoalScores() {
  const { user } = useAuth();
  const { ready, entriesRevision } = useActiveSession();
  const [scores, setScores] = useState<DailyGoalScore[]>([]);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    if (!ready) return;
    runDailyGoalScoreSnapshot(user?.id);
    setScores(getDailyGoalScores());
  }, [ready, user?.id]);

  useEffect(() => {
    reload();
  }, [reload, entriesRevision, revision]);

  useEffect(() => {
    return subscribeDataRefresh(() => setRevision((value) => value + 1));
  }, []);

  return { scores, ready, reload };
}
