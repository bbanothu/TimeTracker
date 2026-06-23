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
}: {
  tagId: string;
  targetMinutes: number | null;
  onSaveGoal: (tagId: string, targetMinutes: number) => Promise<void>;
}) {
  const colors = useAppColors();
  const initial = splitMinutes(targetMinutes ?? 0);
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [buttonState, setButtonState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = splitMinutes(targetMinutes ?? 0);
    setHours(String(next.hours));
    setMinutes(String(next.minutes));
    setButtonState('idle');
    setError(null);
  }, [targetMinutes]);

  useEffect(() => {
    if (buttonState !== 'saved') return;
    const timer = setTimeout(() => setButtonState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [buttonState]);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const parseDraft = () => {
    const parsedHours = Math.max(0, parseInt(hours, 10) || 0);
    const parsedMinutes = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    return parsedHours * 60 + parsedMinutes;
  };

  const commit = async () => {
    const total = parseDraft();

    setButtonState('saving');
    setError(null);
    try {
      await onSaveGoal(tagId, total);
      setButtonState('saved');
    } catch (err) {
      setButtonState('idle');
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <input
            value={hours}
            onChange={(event) => {
              setHours(event.target.value);
              setButtonState('idle');
              setError(null);
            }}
            disabled={buttonState === 'saving'}
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
            onChange={(event) => {
              setMinutes(event.target.value);
              setButtonState('idle');
              setError(null);
            }}
            disabled={buttonState === 'saving'}
            inputMode="numeric"
            maxLength={2}
            className="w-12 rounded-lg border px-2 py-1.5 text-center text-sm"
            style={inputStyle}
          />
          <span className="text-xs" style={{ color: colors.textMuted }}>
            m
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            commit().catch(console.error);
          }}
          disabled={buttonState === 'saving'}
          className="inline-flex min-w-[4.5rem] shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-100"
          style={{
            backgroundColor: colors.primary,
            color: colors.textOnPrimary,
          }}
        >
          {buttonState === 'saving' ? (
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
          ) : (
            (buttonState === 'saved' ? 'Saved' : 'Save')
          )}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-right text-xs font-medium" style={{ color: colors.destructive }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function GoalsList({
  categories,
  goals,
  progressByTagId,
  onSaveGoal,
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
        const hasTarget = targetMinutes !== null;
        const targetMs = hasTarget ? targetMinutes * 60_000 : 0;
        const ratio =
          targetMs > 0 ? Math.min(todayMs / targetMs, 1) : todayMs > 0 ? 1 : 0;
        const overGoal = hasTarget && (targetMs === 0 ? todayMs > 0 : todayMs > targetMs);

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
            />

            {hasTarget ? (
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
