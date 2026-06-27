import { addDays, parse, startOfDay } from 'date-fns';
import { AppState } from 'react-native';

import {
  getAllEntries,
  getAllTags,
  getDailyGoalScores,
  getGoals,
  saveDailyGoalScore,
} from '@/db/client';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { computeDailyAverageScore, formatDateKey } from '@/utils/goalProgressHistory';

function getEarliestEntryDay(): Date | null {
  const entries = getAllEntries();
  if (entries.length === 0) return null;
  const minMs = Math.min(...entries.map((entry) => entry.startedAt));
  return startOfDay(new Date(minMs));
}

export function snapshotDailyGoalScores(): number {
  const entries = getAllEntries();
  const tags = getAllTags();
  const goals = getGoals();
  if (goals.length === 0) return 0;

  const existing = new Set(getDailyGoalScores().map((score) => score.dateKey));
  const yesterday = startOfDay(addDays(new Date(), -1));
  const earliest = getEarliestEntryDay() ?? yesterday;
  const startDay = earliest.getTime() > yesterday.getTime() ? yesterday : earliest;

  let saved = 0;
  let cursor = startDay;
  while (cursor.getTime() <= yesterday.getTime()) {
    const dateKey = formatDateKey(cursor);
    if (!existing.has(dateKey)) {
      const day = parse(dateKey, 'yyyy-MM-dd', new Date());
      const score = computeDailyAverageScore(day, entries, tags, goals);
      if (score !== null) {
        saveDailyGoalScore(dateKey, score);
        saved += 1;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return saved;
}

export function runDailyGoalScoreSnapshot(userId?: string): void {
  const saved = snapshotDailyGoalScores();
  if (saved > 0) {
    notifyDataRefresh();
    pushChangesInBackground(userId);
  }
}

let midnightTimer: ReturnType<typeof setTimeout> | null = null;

export function startDailyGoalScoreScheduler(userId: string | undefined): () => void {
  const scheduleMidnight = () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    const now = new Date();
    const nextMidnight = startOfDay(addDays(now, 1));
    const delay = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

    midnightTimer = setTimeout(() => {
      runDailyGoalScoreSnapshot(userId);
      scheduleMidnight();
    }, delay);
  };

  scheduleMidnight();

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      runDailyGoalScoreSnapshot(userId);
    }
  });

  return () => {
    if (midnightTimer) clearTimeout(midnightTimer);
    subscription.remove();
  };
}
