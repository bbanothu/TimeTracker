import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
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
import { getStackScreenOptions } from '@/navigation/headerOptions';
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
  const navigation = useNavigation();
  const colors = useAppColors();
  const params = useLocalSearchParams<{ anchorDate?: string; period?: string }>();
  const { anchorDate, period } = parseProgressParams(params.anchorDate, params.period);
  const { tags } = useTags();
  const { goals } = useGoals();
  const { scores } = useDailyGoalScores();
  const { entriesRevision, sessions, tick } = useActiveSession();

  useLayoutEffect(() => {
    navigation.setOptions(
      getStackScreenOptions(colors, 'Progress')({ navigation: navigation as never }),
    );
  }, [colors, navigation]);

  const displayScores = useMemo(() => {
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
  }, [scores, tags, goals, entriesRevision, sessions, tick, anchorDate, period]);

  const subtitle = formatPeriodLabel(anchorDate, period);

  return (
    <AppBackground>
      <TabScreenContainer>
        <TabScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-8 pt-2"
          pageHeader={false}
        >
          <Text className="mb-1 text-sm font-medium" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>

          <DailyGoalScoreList scores={displayScores} />
        </TabScrollView>
      </TabScreenContainer>
    </AppBackground>
  );
}
