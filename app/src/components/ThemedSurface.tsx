import { View, type ViewProps } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface ThemedSurfaceProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'surface' | 'glass';
  className?: string;
}

export function ThemedSurface({
  children,
  variant = 'surface',
  className,
  style,
  ...props
}: ThemedSurfaceProps) {
  const colors = useAppColors();
  const isGlass = variant === 'glass';

  return (
    <View
      className={`rounded-2xl border ${className ?? ''}`}
      style={[
        {
          backgroundColor: isGlass ? colors.glass : colors.surface,
          borderColor: isGlass ? colors.glassBorder : colors.surfaceBorder,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
