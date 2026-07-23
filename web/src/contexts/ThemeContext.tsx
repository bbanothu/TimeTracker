import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import { darkColors, type AppColors } from '@/theme/colors';

const ThemeContext = createContext<{ colors: AppColors } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('timetracker-theme', 'dark');
  }, []);

  const value = useMemo(() => ({ colors: darkColors }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppColors() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppColors must be used within ThemeProvider');
  return context.colors;
}
