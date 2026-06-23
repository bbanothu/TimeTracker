import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag, TagDailyGoal } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface GoalsListProps {
  categories: Tag[];
  goals: TagDailyGoal[];
  progressByTagId: Map<string, number>;
  onSaveGoal: (tagId: string, targetMinutes: number) => void | Promise<void>;
  onInputFocus?: (layout: { y: number; height: number }) => void;
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
  onInputFocus,
}: {
  tagId: string;
  targetMinutes: number | null;
  onSaveGoal: (tagId: string, targetMinutes: number) => void | Promise<void>;
  onInputFocus?: (layout: { y: number; height: number }) => void;
}) {
  const colors = useAppColors();
  const rowRef = useRef<View>(null);
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
    width: 36,
    height: 32,
    paddingHorizontal: 4,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    color: colors.text,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : {}),
  };

  const unitStyle = {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 32,
  };

  const parseDraft = () => {
    const parsedHours = Math.max(0, parseInt(hours, 10) || 0);
    const parsedMinutes = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    return parsedHours * 60 + parsedMinutes;
  };

  const handleInputFocus = () => {
    if (!onInputFocus) return;

    const delay = Platform.OS === 'ios' ? 100 : 0;
    setTimeout(() => {
      rowRef.current?.measureInWindow((_x, y, _width, height) => {
        onInputFocus({ y, height });
      });
    }, delay);
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
    <View ref={rowRef} className="mt-2">
      <View className="flex-row items-center justify-between gap-3">
        <View
          className="flex-row items-center overflow-hidden rounded-lg border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <TextInput
            value={hours}
            onChangeText={(value) => {
              setHours(value);
              setButtonState('idle');
              setError(null);
            }}
            onFocus={handleInputFocus}
            keyboardType="number-pad"
            maxLength={2}
            editable={buttonState !== 'saving'}
            style={[inputStyle, { paddingLeft: 8 }]}
          />
          <Text className="pr-2 font-medium" style={unitStyle}>
            h
          </Text>
          <View className="h-5 w-px" style={{ backgroundColor: colors.inputBorder }} />
          <TextInput
            value={minutes}
            onChangeText={(value) => {
              setMinutes(value);
              setButtonState('idle');
              setError(null);
            }}
            onFocus={handleInputFocus}
            keyboardType="number-pad"
            maxLength={2}
            editable={buttonState !== 'saving'}
            style={inputStyle}
          />
          <Text className="px-2 font-medium" style={unitStyle}>
            m
          </Text>
        </View>
        <Pressable
          onPress={() => {
            commit().catch(console.error);
          }}
          disabled={buttonState === 'saving'}
          className="h-8 min-w-[4.5rem] items-center justify-center rounded-lg px-3"
          style={{ backgroundColor: colors.primary }}
        >
          {buttonState === 'saving' ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text className="text-xs font-semibold" style={{ color: colors.textOnPrimary }}>
              {buttonState === 'saved' ? 'Saved' : 'Save'}
            </Text>
          )}
        </Pressable>
      </View>
      {error ? (
        <Text className="mt-1.5 text-right text-xs font-medium" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function GoalsList({
  categories,
  goals,
  progressByTagId,
  onSaveGoal,
  onInputFocus,
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
        const hasTarget = targetMinutes !== null;
        const targetMs = hasTarget ? targetMinutes * 60_000 : 0;
        const ratio =
          targetMs > 0 ? Math.min(todayMs / targetMs, 1) : todayMs > 0 ? 1 : 0;
        const overGoal = hasTarget && (targetMs === 0 ? todayMs > 0 : todayMs > targetMs);

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
              onInputFocus={onInputFocus}
            />

            {hasTarget ? (
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
