import { addDays, endOfDay, format, parse, startOfDay } from 'date-fns';

import type { ActiveSession, PeriodType, Tag, TagDailyGoal, TimeEntry } from '@/types';
import { computeCategoryDurationsToday } from '@/utils/goalProgress';
import { isTagIncludedInAnalytics } from '@/utils/tagAnalytics';
import { getPeriodBounds } from '@/utils/periodBounds';

export interface DailyGoalScore {
  id: string;
  dateKey: string;
  scorePercent: number;
}

export interface DailyGoalScoreDisplay extends DailyGoalScore {
  isLive?: boolean;
}

export function formatDateKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

export function formatScoreDateLabel(dateKey: string, isLive = false): string {
  const label = format(parse(dateKey, 'yyyy-MM-dd', new Date()), 'EEE, MMM d, yyyy');
  return isLive ? `${label} · so far` : label;
}

export function computeDailyAverageScore(
  day: Date,
  entries: TimeEntry[],
  tags: Tag[],
  goals: TagDailyGoal[],
  activeSessions: ActiveSession[] = [],
  now: Date = new Date(),
): number | null {
  if (goals.length === 0) return null;

  const goalsByTagId = new Map(goals.map((goal) => [goal.tagId, goal]));
  const categoriesWithGoals = tags.filter(
    (tag) => tag.parentId === null && goalsByTagId.has(tag.id) && isTagIncludedInAnalytics(tag),
  );

  if (categoriesWithGoals.length === 0) return null;

  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  const isToday = formatDateKey(day) === formatDateKey(now);
  const durations = computeCategoryDurationsToday(
    entries,
    tags,
    dayStart,
    dayEnd,
    isToday ? activeSessions : [],
    isToday ? now.getTime() : dayEnd,
  );

  const percents = categoriesWithGoals.map((tag) => {
    const goal = goalsByTagId.get(tag.id)!;
    const actualMs = durations.get(tag.id) ?? 0;
    const targetMs = goal.targetMinutes * 60_000;
    if (targetMs === 0) return actualMs === 0 ? 100 : 0;
    return (actualMs / targetMs) * 100;
  });

  const average = percents.reduce((sum, value) => sum + value, 0) / percents.length;
  return Math.round(average);
}

export function buildProgressDisplayScores(
  storedScores: DailyGoalScore[],
  entries: TimeEntry[],
  tags: Tag[],
  goals: TagDailyGoal[],
  activeSessions: ActiveSession[],
  anchorDate: Date,
  period: PeriodType,
  now: Date = new Date(),
): DailyGoalScoreDisplay[] {
  const { start, end } = getPeriodBounds(anchorDate, period);
  const storedByKey = new Map(storedScores.map((score) => [score.dateKey, score]));
  const todayKey = formatDateKey(now);
  const days: Date[] = [];

  if (period === 'day') {
    days.push(startOfDay(start));
  } else {
    let cursor = startOfDay(start);
    const endDay = startOfDay(end);
    const today = startOfDay(now);
    while (cursor.getTime() <= endDay.getTime() && cursor.getTime() <= today.getTime()) {
      days.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
  }

  const results: DailyGoalScoreDisplay[] = [];

  for (const day of days) {
    const dateKey = formatDateKey(day);
    const isToday = dateKey === todayKey;

    if (isToday) {
      const liveScore = computeDailyAverageScore(day, entries, tags, goals, activeSessions, now);
      if (liveScore === null) continue;

      const stored = storedByKey.get(dateKey);
      results.push({
        id: stored?.id ?? `live-${dateKey}`,
        dateKey,
        scorePercent: liveScore,
        isLive: true,
      });
      continue;
    }

    const stored = storedByKey.get(dateKey);
    if (stored) {
      results.push({ ...stored, isLive: false });
      continue;
    }

    const computed = computeDailyAverageScore(day, entries, tags, goals, [], now);
    if (computed !== null) {
      results.push({
        id: `computed-${dateKey}`,
        dateKey,
        scorePercent: computed,
        isLive: false,
      });
    }
  }

  return results.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function formatGoalPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
