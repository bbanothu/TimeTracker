import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'timetracker-theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  ready: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Light/dark toggle is temporarily disabled — always dark.
    setColorScheme('dark');
    AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark').catch(() => undefined);
    setReady(true);
  }, [setColorScheme]);

  const toggleTheme = useCallback(() => {
    // no-op while theme toggle is disabled
  }, []);

  const setTheme = useCallback((_mode: ThemeMode) => {
    // no-op while theme toggle is disabled
  }, []);

  const value = useMemo(
    () => ({
      ready,
      isDark: true,
      toggleTheme,
      setTheme,
    }),
    [ready, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
