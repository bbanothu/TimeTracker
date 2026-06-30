import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DailyGoalScoreList } from '@/components/ui/DailyGoalScoreList';
import { PageLoading } from '@/components/ui/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/contexts/GoalsContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { fetchDailyGoalScores, snapshotDailyGoalScores } from '@/services/dailyGoalScoreService';
import { fetchAllEntries } from '@/services/data';
import type { DailyGoalScore, PeriodType, TimeEntry } from '@/types';
import { formatPeriodLabel } from '@/utils/periodBounds';
import { buildProgressDisplayScores } from '@/utils/goalProgressHistory';

function parseProgressParams(searchParams: URLSearchParams): {
  anchorDate: Date;
  period: PeriodType;
} {
  const anchorRaw = searchParams.get('date');
  const periodRaw = searchParams.get('period');
  const anchorDate = anchorRaw ? new Date(anchorRaw) : new Date();
  const period: PeriodType = periodRaw === 'week' || periodRaw === 'month' ? periodRaw : 'day';

  return {
    anchorDate: Number.isNaN(anchorDate.getTime()) ? new Date() : anchorDate,
    period,
  };
}

export function GoalProgressPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { anchorDate, period } = parseProgressParams(searchParams);
  const { tags } = useTags();
  const { goals, ready: goalsReady } = useGoals();
  const { ready, entriesRevision, sessions, tick } = useTimer();
  const [scores, setScores] = useState<DailyGoalScore[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allEntries = await fetchAllEntries(user.id);
      setEntries(allEntries);
      await snapshotDailyGoalScores(user.id, tags, allEntries, goals);
      setScores(await fetchDailyGoalScores(user.id));
    } finally {
      setLoading(false);
    }
  }, [user, tags, goals]);

  useEffect(() => {
    if (!goalsReady) return;
    loadData().catch(console.error);
  }, [goalsReady, loadData]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      loadData().catch(console.error);
    });
  }, [user, loadData]);

  const displayScores = useMemo(() => {
    if (!ready || !goalsReady || loading) return [];
    return buildProgressDisplayScores(scores, entries, tags, goals, sessions, anchorDate, period);
  }, [
    ready,
    goalsReady,
    loading,
    scores,
    entries,
    tags,
    goals,
    sessions,
    tick,
    entriesRevision,
    anchorDate,
    period,
  ]);

  const subtitle = formatPeriodLabel(anchorDate, period);

  if (!goalsReady || loading || !ready) {
    return <PageLoading />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/stats" className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          ← Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: colors.headerText }}>
          Progress
        </h1>
        <span className="w-10" />
      </div>

      <p className="mb-1 text-sm font-medium" style={{ color: colors.textMuted }}>
        {subtitle}
      </p>

      <DailyGoalScoreList scores={displayScores} />
    </div>
  );
}
