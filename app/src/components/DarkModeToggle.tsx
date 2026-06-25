import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { useTheme } from '@/hooks/useTheme';

export function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const colors = useAppColors();

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full border p-2.5 active:opacity-80"
      style={{
        backgroundColor: 'transparent',
        borderColor: colors.glassBorder,
      }}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={colors.text}
      />
    </Pressable>
  );
}
