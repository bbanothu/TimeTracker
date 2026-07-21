import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { darkColors, type AppColors } from '@/theme/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'timetracker-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light/dark toggle is temporarily disabled — always dark.
  const [mode] = useState<ThemeMode>('dark');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem(STORAGE_KEY, 'dark');
  }, []);

  const toggle = useCallback(() => {
    // no-op while theme toggle is disabled
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDark: true,
      colors: darkColors,
      toggle,
    }),
    [mode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function useAppColors() {
  return useTheme().colors;
}
