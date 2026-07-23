import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

/** Matches web SessionControlButtons — compact control chrome. */
export const CONTROL_SIZE = 28;
export const CONTROL_ICON_SIZE = 14;

interface StartSessionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function StartSessionButton({ onPress, disabled }: StartSessionButtonProps) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Start session"
      className="items-center justify-center rounded-full active:opacity-80"
      style={{
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        backgroundColor: colors.primary,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons
        name="play"
        size={CONTROL_ICON_SIZE}
        color={colors.textOnPrimary}
        style={{ marginLeft: 1 }}
      />
    </Pressable>
  );
}

interface StopSessionButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function StopSessionButton({
  onPress,
  accessibilityLabel = 'Stop session',
}: StopSessionButtonProps) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center rounded-full active:opacity-80"
      style={{
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        backgroundColor: colors.stop,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
        }}
      />
    </Pressable>
  );
}
