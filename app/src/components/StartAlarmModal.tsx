import DateTimePicker from '@react-native-community/datetimepicker';
import { addMinutes, format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { TagDropdown } from '@/components/TagDropdown';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';

const DURATION_CHIPS_MINUTES = [15, 25, 45, 60] as const;

interface StartAlarmModalProps {
  visible: boolean;
  tags: Tag[];
  initialTagId?: string | null;
  onClose: () => void;
  onStart: (tagIds: string[], alarmAt: number) => void | Promise<void>;
}

type Mode = 'duration' | 'until';

export function StartAlarmModal({
  visible,
  tags,
  initialTagId = null,
  onClose,
  onStart,
}: StartAlarmModalProps) {
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('duration');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [untilAt, setUntilAt] = useState(() => addMinutes(new Date(), 30));
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode('duration');
    setDurationMinutes(25);
    setCustomMinutes('');
    setUntilAt(addMinutes(new Date(), 30));
    setShowUntilPicker(false);
    setError(null);
    setSaving(false);
  }, [visible]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (initialTagId && tags.some((tag) => tag.id === initialTagId)) {
      setSelectedTagId(initialTagId);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId, initialTagId, visible]);

  const resolveAlarmAt = (): number | null => {
    if (mode === 'duration') {
      const custom = Number.parseInt(customMinutes.trim(), 10);
      const minutes =
        customMinutes.trim().length > 0 && Number.isFinite(custom) && custom > 0
          ? custom
          : durationMinutes;
      if (!Number.isFinite(minutes) || minutes <= 0) return null;
      return Date.now() + minutes * 60_000;
    }
    return untilAt.getTime();
  };

  const handleStart = async () => {
    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose an activity.');
        return;
      }
      const alarmAt = resolveAlarmAt();
      if (alarmAt == null || alarmAt <= Date.now() + 5_000) {
        setError('Pick an end time at least a few seconds from now.');
        return;
      }
      setSaving(true);
      await onStart([selectedTagId], alarmAt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start alarm');
    } finally {
      setSaving(false);
    }
  };

  const chipStyle = (selected: boolean) => ({
    backgroundColor: selected ? colors.selectedBg : colors.inputBg,
    borderColor: selected ? colors.primary : colors.inputBorder,
  });

  return (
    <BottomSheetModal visible={visible} title="Start alarm" onClose={onClose}>
      <Text className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
        Activity
      </Text>
      <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

      <View className="mt-4 mb-2 flex-row gap-2">
        {(['duration', 'until'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            className="flex-1 items-center rounded-xl border px-3 py-2.5 active:opacity-80"
            style={chipStyle(mode === value)}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: mode === value ? colors.primary : colors.text }}
            >
              {value === 'duration' ? 'Duration' : 'Until time'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'duration' ? (
        <View>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {DURATION_CHIPS_MINUTES.map((minutes) => {
              const selected = customMinutes.trim().length === 0 && durationMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  onPress={() => {
                    setCustomMinutes('');
                    setDurationMinutes(minutes);
                  }}
                  className="rounded-full border px-3 py-2 active:opacity-80"
                  style={chipStyle(selected)}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: selected ? colors.primary : colors.text }}
                  >
                    {minutes}m
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mb-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
            Custom minutes
          </Text>
          <TextInput
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="e.g. 40"
            placeholderTextColor={colors.inputPlaceholder}
            className="rounded-xl border px-4 py-3 text-base"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            }}
          />
        </View>
      ) : (
        <View>
          <Pressable
            onPress={() => setShowUntilPicker((value) => !value)}
            className="rounded-xl border px-4 py-3 active:opacity-80"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            }}
          >
            <Text className="text-base" style={{ color: colors.text }}>
              Until {format(untilAt, 'h:mm a')}
            </Text>
          </Pressable>
          {showUntilPicker ? (
            <DateTimePicker
              value={untilAt}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                if (!date) return;
                const next = setMilliseconds(
                  setSeconds(
                    setMinutes(setHours(new Date(), date.getHours()), date.getMinutes()),
                    0,
                  ),
                  0,
                );
                // If chosen time already passed today, roll to tomorrow.
                if (next.getTime() <= Date.now() + 5_000) {
                  next.setDate(next.getDate() + 1);
                }
                setUntilAt(next);
                if (Platform.OS !== 'ios') setShowUntilPicker(false);
              }}
            />
          ) : null}
        </View>
      )}

      {error ? (
        <Text className="mt-3 text-sm text-rose-500">{error}</Text>
      ) : (
        <Text className="mt-3 text-xs" style={{ color: colors.textMuted }}>
          When time is up you can finish (log the session) or extend. Ignoring the alarm keeps
          tracking.
        </Text>
      )}

      <View className="mt-4">
        <ActionButton
          label="Start alarm"
          onPress={handleStart}
          loading={saving}
          disabled={saving}
        />
      </View>
    </BottomSheetModal>
  );
}
