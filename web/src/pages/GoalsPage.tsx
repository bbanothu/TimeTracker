import { useMemo } from 'react';

import { GoalsList } from '@/components/ui/GoalsList';
import { useGoals } from '@/contexts/GoalsContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { computeCategoryDurationsToday } from '@/utils/goalProgress';
import { getPeriodBounds } from '@/utils/periodBounds';

export function GoalsPage() {
  const colors = useAppColors();
  const { tags } = useTags();
  const { goals, ready: goalsReady, saveGoal, clearGoal } = useGoals();
  const { ready, todayEntries, sessions, tick } = useTimer();

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

  const handleSaveGoal = async (tagId: string, targetMinutes: number) => {
    await saveGoal(tagId, targetMinutes);
    notifyDataRefresh();
  };

  const handleClearGoal = async (tagId: string) => {
    await clearGoal(tagId);
    notifyDataRefresh();
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
        onClearGoal={handleClearGoal}
      />
    </div>
  );
}
