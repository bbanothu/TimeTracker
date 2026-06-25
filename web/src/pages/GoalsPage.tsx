import { useMemo } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { GoalsList } from '@/components/ui/GoalsList';
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
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div className="lg:max-w-4xl">
      <PageHeader title="Goals" />
      <div className="lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <p className="mb-4 text-sm leading-6 lg:mb-0 lg:sticky lg:top-8" style={{ color: colors.textOnBg }}>
          Set daily targets for your top-level categories. Saved targets stay on your account and
          apply every day until you change them. Time tracked on sub-tags counts toward the parent.
        </p>
        <GoalsList
          categories={categories}
          goals={goals}
          progressByTagId={progressByTagId}
          onSaveGoal={handleSaveGoal}
        />
      </div>
    </div>
  );
}
