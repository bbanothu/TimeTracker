import { useEffect, useMemo, useState } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag, TagDailyGoal } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface GoalsListProps {
  categories: Tag[];
  goals: TagDailyGoal[];
  progressByTagId: Map<string, number>;
  onSaveGoal: (tagId: string, targetMinutes: number) => Promise<void>;
  onClearGoal: (tagId: string) => Promise<void>;
}

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

function GoalTargetInputs({
  tagId,
  targetMinutes,
  onSaveGoal,
  onClearGoal,
}: {
  tagId: string;
  targetMinutes: number | null;
  onSaveGoal: (tagId: string, targetMinutes: number) => Promise<void>;
  onClearGoal: (tagId: string) => Promise<void>;
}) {
  const colors = useAppColors();
  const initial = splitMinutes(targetMinutes ?? 0);
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = splitMinutes(targetMinutes ?? 0);
    setHours(String(next.hours));
    setMinutes(String(next.minutes));
  }, [targetMinutes]);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const commit = async () => {
    const parsedHours = Math.max(0, parseInt(hours, 10) || 0);
    const parsedMinutes = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const total = parsedHours * 60 + parsedMinutes;

    setSaving(true);
    try {
      if (total <= 0) {
        if (targetMinutes !== null) await onClearGoal(tagId);
        return;
      }

      if (targetMinutes === total) return;
      await onSaveGoal(tagId, total);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
        Target
      </span>
      <input
        value={hours}
        onChange={(event) => setHours(event.target.value)}
        onBlur={() => {
          commit().catch(console.error);
        }}
        disabled={saving}
        inputMode="numeric"
        maxLength={2}
        className="w-12 rounded-lg border px-2 py-1.5 text-center text-sm"
        style={inputStyle}
      />
      <span className="text-xs" style={{ color: colors.textMuted }}>
        h
      </span>
      <input
        value={minutes}
        onChange={(event) => setMinutes(event.target.value)}
        onBlur={() => {
          commit().catch(console.error);
        }}
        disabled={saving}
        inputMode="numeric"
        maxLength={2}
        className="w-12 rounded-lg border px-2 py-1.5 text-center text-sm"
        style={inputStyle}
      />
      <span className="text-xs" style={{ color: colors.textMuted }}>
        m
      </span>
    </div>
  );
}

export function GoalsList({
  categories,
  goals,
  progressByTagId,
  onSaveGoal,
  onClearGoal,
}: GoalsListProps) {
  const colors = useAppColors();
  const goalsByTagId = useMemo(
    () => new Map(goals.map((goal) => [goal.tagId, goal])),
    [goals],
  );

  if (categories.length === 0) {
    return (
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        Create top-level tags to set daily goals.
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {categories.map((tag, index) => {
        const goal = goalsByTagId.get(tag.id);
        const targetMinutes = goal?.targetMinutes ?? null;
        const todayMs = progressByTagId.get(tag.id) ?? 0;
        const targetMs = targetMinutes ? targetMinutes * 60_000 : 0;
        const ratio = targetMs > 0 ? Math.min(todayMs / targetMs, 1) : 0;
        const overGoal = targetMs > 0 && todayMs > targetMs;

        return (
          <div
            key={tag.id}
            className="px-3 py-3"
            style={{
              borderBottomWidth: index < categories.length - 1 ? 1 : 0,
              borderBottomColor: colors.surfaceBorder,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="flex-1 text-sm font-semibold" style={{ color: colors.textOnBg }}>
                {formatTagName(tag.name)}
              </span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: colors.textOnBg }}
              >
                {formatDurationLong(todayMs)}
              </span>
            </div>

            <GoalTargetInputs
              tagId={tag.id}
              targetMinutes={targetMinutes}
              onSaveGoal={onSaveGoal}
              onClearGoal={onClearGoal}
            />

            {targetMs > 0 ? (
              <div className="mt-3">
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.surfaceBorder }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: overGoal ? colors.destructive : tag.color,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs font-medium" style={{ color: colors.textMuted }}>
                  {formatDurationLong(todayMs)} / {formatDurationLong(targetMs)}
                  {overGoal ? ' · over goal' : ''}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </ThemedSurface>
  );
}
