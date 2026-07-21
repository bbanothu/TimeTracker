import type { ReactNode } from 'react';

import { useTheme } from '@/contexts/ThemeContext';

export function AppBackground({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();

  return (
    <div className="relative h-dvh overflow-hidden" style={{ backgroundColor: colors.pageBg }}>
      <img
        src="/assets/login1.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {isDark ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(180deg, ${colors.backgroundGradient[0]}, ${colors.backgroundGradient[1]}, ${colors.backgroundGradient[2]})`,
            }}
          />
        </>
      ) : null}
      <div className="relative z-10 flex h-full w-full flex-col">{children}</div>
    </div>
  );
}
