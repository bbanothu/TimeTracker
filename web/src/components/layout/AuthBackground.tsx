import type { ReactNode } from 'react';

import { useTheme } from '@/contexts/ThemeContext';

export function AuthBackground({
  children,
  image = '/assets/login1.jpg',
}: {
  children: ReactNode;
  image?: string;
}) {
  const { colors, isDark } = useTheme();

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ backgroundColor: colors.pageBg }}>
      <img
        src={image}
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
      <div className="relative z-10">{children}</div>
    </div>
  );
}
