import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { DailyGoalScoreList } from '@/components/DailyGoalScoreList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { getAllEntries, getGoals } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useDailyGoalScores } from '@/hooks/useDailyGoalScores';
import { useGoals } from '@/hooks/useGoals';
import { useTags } from '@/hooks/useTags';
import type { PeriodType } from '@/types';
import { formatPeriodLabel } from '@/utils/periodBounds';
import { buildProgressDisplayScores } from '@/utils/goalProgressHistory';

function parseProgressParams(
  anchorDateParam?: string | string[],
  periodParam?: string | string[],
): { anchorDate: Date; period: PeriodType } {
  const anchorRaw = Array.isArray(anchorDateParam) ? anchorDateParam[0] : anchorDateParam;
  const periodRaw = Array.isArray(periodParam) ? periodParam[0] : periodParam;
  const anchorDate = anchorRaw ? new Date(anchorRaw) : new Date();
  const period: PeriodType = periodRaw === 'week' || periodRaw === 'month' ? periodRaw : 'day';

  return {
    anchorDate: Number.isNaN(anchorDate.getTime()) ? new Date() : anchorDate,
    period,
  };
}

export default function ProgressScreen() {
  const colors = useAppColors();
  const params = useLocalSearchParams<{ anchorDate?: string; period?: string }>();
  const { anchorDate, period } = parseProgressParams(params.anchorDate, params.period);
  const { tags } = useTags();
  const { goals, ready: goalsReady } = useGoals();
  const { scores, ready: scoresReady } = useDailyGoalScores();
  const { ready, entriesRevision, sessions, tick } = useActiveSession();

  const displayScores = useMemo(() => {
    if (!ready || !goalsReady || !scoresReady) return [];

    const entries = getAllEntries();
    const loadedGoals = goals.length > 0 ? goals : getGoals();

    return buildProgressDisplayScores(
      scores,
      entries,
      tags,
      loadedGoals,
      sessions,
      anchorDate,
      period,
    );
  }, [
    ready,
    goalsReady,
    scoresReady,
    scores,
    tags,
    goals,
    entriesRevision,
    sessions,
    tick,
    anchorDate,
    period,
  ]);

  const subtitle = formatPeriodLabel(anchorDate, period);

  if (!ready || !goalsReady || !scoresReady) {
    return (
      <AppBackground>
        <TabScreenContainer className="items-center justify-center">
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </TabScreenContainer>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <TabScreenContainer>
        <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
          <Text className="mb-1 text-sm font-medium" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>

          <DailyGoalScoreList scores={displayScores} />
        </TabScrollView>
      </TabScreenContainer>
    </AppBackground>
  );
}
