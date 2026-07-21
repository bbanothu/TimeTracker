import { ThemedSurface } from '@/components/ThemedSurface';
import type { StyleProp, ViewStyle } from 'react-native';

interface SettingsGroupProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** Inset grouped list container (iOS Settings style). */
export function SettingsGroup({ children, className, style }: SettingsGroupProps) {
  return (
    <ThemedSurface className={`mb-4 p-0 ${className ?? ''}`} style={style}>
      {children}
    </ThemedSurface>
  );
}
