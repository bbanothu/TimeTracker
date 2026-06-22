import { useMemo } from 'react';
import { Text } from 'react-native';

import { GoalsList } from '@/components/GoalsList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useGoals } from '@/hooks/useGoals';
import { useTags } from '@/hooks/useTags';
import { computeCategoryDurationsToday } from '@/utils/goalProgress';
import { getPeriodBounds } from '@/utils/periodBounds';

export default function GoalsScreen() {
  const colors = useAppColors();
  const { tags } = useTags();
  const { goals, ready: goalsReady, saveGoal, clearGoal } = useGoals();
  const { ready, todayEntries, sessions, tick } = useActiveSession();

  const categories = useMemo(
    () => tags.filter((tag) => tag.parentId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [tags],
  );

  const progressByTagId = useMemo(() => {
    const { start, end } = getPeriodBounds(new Date(), 'day');
    return computeCategoryDurationsToday(
      todayEntries,
      tags,
      start.getTime(),
      end.getTime(),
      sessions,
      Date.now(),
    );
  }, [todayEntries, tags, sessions, tick]);

  if (!ready || !goalsReady) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer>
      <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Set daily targets for your top-level categories. Time tracked on sub-tags counts toward
          the parent.
        </Text>
        <GoalsList
          categories={categories}
          goals={goals}
          progressByTagId={progressByTagId}
          onSaveGoal={saveGoal}
          onClearGoal={clearGoal}
        />
      </TabScrollView>
    </TabScreenContainer>
  );
}
