import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { useAppColors } from '@/hooks/useAppColors';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export function DeleteAccountModal({ visible, onClose, onConfirm }: DeleteAccountModalProps) {
  const colors = useAppColors();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPassword('');
    setError(null);
    setDeleting(false);
  }, [visible]);

  const handleConfirm = async () => {
    if (deleting) return;

    try {
      setError(null);
      setDeleting(true);
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account');
      setDeleting(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Delete account"
      onClose={deleting ? () => undefined : onClose}
      maxHeightFraction={0.72}
      keyboardAdjust="offset"
    >
      <Text className="mb-3 text-sm leading-6" style={{ color: colors.textOnBg }}>
        This permanently deletes your account and all related data — sessions, tags, places, goals,
        friends, calendar connection, and profile photo. This cannot be undone.
      </Text>
      <Text className="mb-4 text-sm leading-6" style={{ color: colors.textMuted }}>
        Enter your password to confirm.
      </Text>

      <Text className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
        Password
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.inputPlaceholder}
        secureTextEntry
        autoComplete="password"
        editable={!deleting}
        className="mb-3 rounded-xl border px-4 py-3 text-base"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      />

      {error ? <Text className="mb-3 text-sm text-rose-500">{error}</Text> : null}

      <View className="gap-2">
        <ActionButton
          label="Delete account"
          variant="destructive"
          onPress={() => {
            handleConfirm().catch(console.error);
          }}
          loading={deleting}
          disabled={deleting || password.trim().length === 0}
        />
        <ActionButton label="Cancel" variant="secondary" onPress={onClose} disabled={deleting} />
      </View>
    </BottomSheetModal>
  );
}
