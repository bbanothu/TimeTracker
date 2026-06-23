import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal, getBottomSheetScrollHeight } from '@/components/BottomSheetModal';
import { TagDropdown } from '@/components/TagDropdown';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';
import { defaultManualEntryTimes } from '@/utils/manualEntryDefaults';

interface AddManualSessionModalProps {
  visible: boolean;
  tags: Tag[];
  onClose: () => void;
  onSave: (tagIds: string[], startedAt: number, endedAt: number) => void;
}

type PickerField = 'start' | 'end' | null;

export function AddManualSessionModal({
  visible,
  tags,
  onClose,
  onSave,
}: AddManualSessionModalProps) {
  const colors = useAppColors();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(() => defaultManualEntryTimes().startAt);
  const [endAt, setEndAt] = useState(() => defaultManualEntryTimes().endAt);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const { startAt: nextStart, endAt: nextEnd } = defaultManualEntryTimes();
    setStartAt(nextStart);
    setEndAt(nextEnd);
    setPickerField(null);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  const handleSave = () => {
    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose an activity.');
        return;
      }
      onSave([selectedTagId], startAt.getTime(), endAt.getTime());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save session');
    }
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
  };

  const scrollMaxHeight = getBottomSheetScrollHeight(windowHeight, pickerField ? 0.45 : 0.55);

  return (
    <BottomSheetModal
      visible={visible}
      title="Add past session"
      onClose={onClose}
      maxHeightFraction={0.92}
    >
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: scrollMaxHeight }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          Activity
        </Text>
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

        <Text className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          Start
        </Text>
        <Pressable
          onPress={() => {
            setPickerField('start');
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
          className="rounded-xl border px-4 py-3"
          style={inputStyle}
        >
          <Text className="text-base font-medium" style={{ color: colors.text }}>
            {format(startAt, 'MMM d, yyyy · h:mm a')}
          </Text>
        </Pressable>

        <Text className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          End
        </Text>
        <Pressable
          onPress={() => {
            setPickerField('end');
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
          className="rounded-xl border px-4 py-3"
          style={inputStyle}
        >
          <Text className="text-base font-medium" style={{ color: colors.text }}>
            {format(endAt, 'MMM d, yyyy · h:mm a')}
          </Text>
        </Pressable>

        {pickerField ? (
          <View className="mt-3">
            {Platform.OS === 'ios' ? (
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>
                  {pickerField === 'start' ? 'Start time' : 'End time'}
                </Text>
                <Pressable
                  onPress={() => setPickerField(null)}
                  className="rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.textOnPrimary }}>
                    Done
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <DateTimePicker
              value={pickerField === 'start' ? startAt : endAt}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setPickerField(null);
                }
                if (event.type === 'dismissed' || !date) {
                  if (Platform.OS === 'android') setPickerField(null);
                  return;
                }
                if (pickerField === 'start') {
                  setStartAt(date);
                } else {
                  setEndAt(date);
                }
              }}
            />
          </View>
        ) : null}

        {error ? (
          <Text className="mt-3 text-sm font-medium" style={{ color: colors.destructive }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View className="mt-4">
        <ActionButton label="Add session" onPress={handleSave} size="lg" />
      </View>
    </BottomSheetModal>
  );
}
