import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

export function TabHeaderBackground() {
  const colors = useAppColors();

  return (
    <BlurView
      intensity={colors.blurTint === 'dark' ? 68 : 48}
      tint={colors.blurTint}
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor:
            colors.blurTint === 'dark'
              ? 'rgba(28, 25, 23, 0.42)'
              : 'rgba(255, 252, 245, 0.38)',
        },
      ]}
    />
  );
}
