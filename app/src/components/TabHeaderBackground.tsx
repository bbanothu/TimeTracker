import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

export function TabHeaderBackground() {
  const colors = useAppColors();

  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.surfaceSolid,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.tabBarBorder,
          },
        ]}
      />
    );
  }

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
