import type { HTMLAttributes, ReactNode } from 'react';

import { useAppColors } from '@/contexts/ThemeContext';

interface ThemedSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ThemedSurface({ children, className = '', style, ...props }: ThemedSurfaceProps) {
  const colors = useAppColors();

  return (
    <div
      {...props}
      className={`rounded-2xl border shadow-glass ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
