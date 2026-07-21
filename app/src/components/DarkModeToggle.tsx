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
      className="h-9 w-9 items-center justify-center overflow-hidden rounded-full active:opacity-80"
      style={{
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}
    >
      <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.text} />
    </Pressable>
  );
}
