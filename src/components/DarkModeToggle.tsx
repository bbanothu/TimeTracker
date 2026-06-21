import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800"
    >
      <Text className="text-base">{isDark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}
