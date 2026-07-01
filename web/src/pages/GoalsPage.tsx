import { useMemo } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { GoalsAccountedSummary } from '@/components/ui/GoalsAccountedSummary';
import { GoalsList } from '@/components/ui/GoalsList';
import { PageLoading } from '@/components/ui/PageLoading';
import { useGoals } from '@/contexts/GoalsContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { computeCategoryDurationsToday } from '@/utils/goalProgress';
import { goalCategories } from '@/utils/tagAnalytics';
import { getPeriodBounds } from '@/utils/periodBounds';

export function GoalsPage() {
  const colors = useAppColors();
  const { tags } = useTags();
  const { goals, ready: goalsReady, saveGoal } = useGoals();
  const { ready, todayEntries, sessions, tick } = useTimer();

  const categories = useMemo(() => goalCategories(tags), [tags]);

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

  const handleSaveGoal = async (tagId: string, targetMinutes: number) => {
    await saveGoal(tagId, targetMinutes);
  };

  if (!ready || !goalsReady) {
    return <PageLoading />;
  }

  return (
    <div className="mx-auto w-full max-w-[88rem]">
      <PageHeader
        title="Goals"
        description={
          <p className="max-w-2xl text-sm leading-6" style={{ color: colors.textOnBg }}>
            Set daily targets for your top-level categories. Saved targets stay on your account and
            apply every day until you change them. Time tracked on sub-tags counts toward the
            parent.
          </p>
        }
      />

      <GoalsAccountedSummary progressByTagId={progressByTagId} />

      <GoalsList
        categories={categories}
        goals={goals}
        progressByTagId={progressByTagId}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
}
