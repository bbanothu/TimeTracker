import { addDays, parse, startOfDay } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { fetchAllEntries, fetchGoals } from '@/services/data';
import type { DailyGoalScore, Tag, TagDailyGoal, TimeEntry } from '@/types';
import {
  computeDailyAverageScore,
  formatDateKey,
} from '@/utils/goalProgressHistory';

type ScoreRow = {
  id: string;
  date_key: string;
  score_percent: number;
};

function mapScore(row: ScoreRow): DailyGoalScore {
  return {
    id: row.id,
    dateKey: row.date_key,
    scorePercent: row.score_percent,
  };
}

export async function fetchDailyGoalScores(userId: string): Promise<DailyGoalScore[]> {
  const { data, error } = await supabase
    .from('daily_goal_scores')
    .select('id, date_key, score_percent')
    .eq('user_id', userId)
    .order('date_key', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapScore);
}

export async function upsertDailyGoalScore(
  userId: string,
  dateKey: string,
  scorePercent: number,
): Promise<DailyGoalScore> {
  const { data, error } = await supabase
    .from('daily_goal_scores')
    .upsert(
      {
        user_id: userId,
        date_key: dateKey,
        score_percent: scorePercent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date_key' },
    )
    .select('id, date_key, score_percent')
    .single();

  if (error) throw error;
  return mapScore(data);
}

function getEarliestEntryDay(entries: TimeEntry[]): Date | null {
  if (entries.length === 0) return null;
  const minMs = Math.min(...entries.map((entry) => entry.startedAt));
  return startOfDay(new Date(minMs));
}

export async function snapshotDailyGoalScores(
  userId: string,
  tags: Tag[],
  entries?: TimeEntry[],
  goals?: TagDailyGoal[],
): Promise<number> {
  const [allEntries, allGoals, existingScores] = await Promise.all([
    entries ? Promise.resolve(entries) : fetchAllEntries(userId),
    goals ? Promise.resolve(goals) : fetchGoals(userId),
    fetchDailyGoalScores(userId),
  ]);

  if (allGoals.length === 0) return 0;

  const existing = new Set(existingScores.map((score) => score.dateKey));
  const yesterday = startOfDay(addDays(new Date(), -1));
  const earliest = getEarliestEntryDay(allEntries) ?? yesterday;
  const startDay = earliest.getTime() > yesterday.getTime() ? yesterday : earliest;

  let saved = 0;
  let cursor = startDay;
  while (cursor.getTime() <= yesterday.getTime()) {
    const dateKey = formatDateKey(cursor);
    if (!existing.has(dateKey)) {
      const day = parse(dateKey, 'yyyy-MM-dd', new Date());
      const score = computeDailyAverageScore(day, allEntries, tags, allGoals);
      if (score !== null) {
        await upsertDailyGoalScore(userId, dateKey, score);
        saved += 1;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return saved;
}
