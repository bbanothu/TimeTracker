import type { HTMLAttributes, ReactNode } from 'react';

import { useAppColors } from '@/contexts/ThemeContext';

interface ThemedSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'surface' | 'glass';
}

export function ThemedSurface({
  children,
  className = '',
  style,
  variant = 'glass',
  ...props
}: ThemedSurfaceProps) {
  const colors = useAppColors();
  const wash = variant === 'glass' ? colors.glass : colors.surface;

  return (
    <div
      {...props}
      className={`overflow-hidden rounded-2xl border shadow-glass backdrop-blur-2xl ${className}`}
      style={{
        backgroundColor: wash,
        borderColor: colors.glassBorder,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
