import type { ReactNode } from 'react';

import { useTheme } from '@/contexts/ThemeContext';

export function AppBackground({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img
        src="/assets/login1.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={`pointer-events-none absolute inset-0 ${isDark ? 'backdrop-blur-[2px]' : 'backdrop-blur-[1px]'}`}
        style={{
          backgroundImage: `linear-gradient(180deg, ${colors.backgroundGradient[0]}, ${colors.backgroundGradient[1]}, ${colors.backgroundGradient[2]})`,
        }}
      />
      <div className="relative z-10 flex min-h-dvh w-full flex-col">{children}</div>
    </div>
  );
}
