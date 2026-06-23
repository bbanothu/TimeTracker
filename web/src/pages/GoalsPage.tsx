import { useMemo } from 'react';

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
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Goals
      </h1>
      <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
        Set daily targets for your top-level categories. Saved targets stay on your account and apply
        every day until you change them. Time tracked on sub-tags counts toward the parent.
      </p>
      <GoalsList
        categories={categories}
        goals={goals}
        progressByTagId={progressByTagId}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
}
