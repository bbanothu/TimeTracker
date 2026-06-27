import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput } from 'react-native';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { useAppColors } from '@/hooks/useAppColors';

interface StopSessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (details: string) => void | Promise<void>;
  saving?: boolean;
}

export function StopSessionDetailsModal({
  visible,
  onClose,
  onSave,
  saving = false,
}: StopSessionDetailsModalProps) {
  const colors = useAppColors();
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDetails('');
  }, [visible]);

  const handleSave = () => {
    if (saving) return;
    void Promise.resolve(onSave(details.trim()));
  };

  const saveButton = saving ? (
    <ActivityIndicator size="small" color={colors.primary} />
  ) : (
    <Pressable
      onPress={handleSave}
      accessibilityRole="button"
      accessibilityLabel="Save details"
      className="rounded-full p-1"
      hitSlop={8}
    >
      <Ionicons name="checkmark" size={24} color={colors.primary} />
    </Pressable>
  );

  return (
    <BottomSheetModal
      visible={visible}
      title="Details"
      onClose={onClose}
      headerActions={saveButton}
      maxHeightFraction={0.5}
    >
      <Text className="mb-2 text-sm" style={{ color: colors.textMuted }}>
        Add a note about this session (optional).
      </Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="What did you work on?"
        placeholderTextColor={colors.inputPlaceholder}
        multiline
        textAlignVertical="top"
        className="min-h-[120px] rounded-xl border px-4 py-3 text-base"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      />
    </BottomSheetModal>
  );
}
