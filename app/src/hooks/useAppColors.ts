import { useMemo } from 'react';

import { darkColors, lightColors, type AppColors } from '@/theme/colors';

import { useTheme } from './useTheme';

export function useAppColors(): AppColors {
  const { isDark } = useTheme();
  return useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
}
