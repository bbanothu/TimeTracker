import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag, TagDailyGoal } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface GoalsListProps {
  categories: Tag[];
  goals: TagDailyGoal[];
  progressByTagId: Map<string, number>;
  onSaveGoal: (tagId: string, targetMinutes: number) => void;
  onClearGoal: (tagId: string) => void;
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
  onSaveGoal: (tagId: string, targetMinutes: number) => void;
  onClearGoal: (tagId: string) => void;
}) {
  const colors = useAppColors();
  const initial = splitMinutes(targetMinutes ?? 0);
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));

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

  const commit = () => {
    const parsedHours = Math.max(0, parseInt(hours, 10) || 0);
    const parsedMinutes = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const total = parsedHours * 60 + parsedMinutes;

    if (total <= 0) {
      if (targetMinutes !== null) onClearGoal(tagId);
      return;
    }

    if (targetMinutes === total) return;
    onSaveGoal(tagId, total);
  };

  return (
    <View className="mt-2 flex-row items-center gap-2">
      <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
        Target
      </Text>
      <TextInput
        value={hours}
        onChangeText={setHours}
        onBlur={commit}
        keyboardType="number-pad"
        maxLength={2}
        className="w-12 rounded-lg border px-2 py-1.5 text-center text-sm"
        style={inputStyle}
      />
      <Text className="text-xs" style={{ color: colors.textMuted }}>
        h
      </Text>
      <TextInput
        value={minutes}
        onChangeText={setMinutes}
        onBlur={commit}
        keyboardType="number-pad"
        maxLength={2}
        className="w-12 rounded-lg border px-2 py-1.5 text-center text-sm"
        style={inputStyle}
      />
      <Text className="text-xs" style={{ color: colors.textMuted }}>
        m
      </Text>
    </View>
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
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        Create top-level tags to set daily goals.
      </Text>
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
          <View
            key={tag.id}
            className="px-3 py-3"
            style={{
              borderBottomWidth: index < categories.length - 1 ? 1 : 0,
              borderBottomColor: colors.surfaceBorder,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
              <Text className="flex-1 text-sm font-semibold" style={{ color: colors.textOnBg }}>
                {formatTagName(tag.name)}
              </Text>
              <Text className="text-sm font-semibold tabular-nums" style={{ color: colors.textOnBg }}>
                {formatDurationLong(todayMs)}
              </Text>
            </View>

            <GoalTargetInputs
              tagId={tag.id}
              targetMinutes={targetMinutes}
              onSaveGoal={onSaveGoal}
              onClearGoal={onClearGoal}
            />

            {targetMs > 0 ? (
              <View className="mt-3">
                <View
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.surfaceBorder }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: overGoal ? colors.destructive : tag.color,
                    }}
                  />
                </View>
                <Text className="mt-1 text-xs font-medium" style={{ color: colors.textMuted }}>
                  {formatDurationLong(todayMs)} / {formatDurationLong(targetMs)}
                  {overGoal ? ' · over goal' : ''}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
