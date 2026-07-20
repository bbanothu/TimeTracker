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
  const { colorScheme, setColorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setColorScheme('dark');

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setColorScheme(stored);
          return;
        }
        AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark').catch(() => undefined);
      })
      .finally(() => setReady(true));
  }, [setColorScheme]);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, [colorScheme, setColorScheme]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setColorScheme(mode);
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => undefined);
    },
    [setColorScheme],
  );

  const value = useMemo(
    () => ({
      ready,
      isDark: colorScheme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [ready, colorScheme, toggleTheme, setTheme],
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
