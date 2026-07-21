import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

/** Fixed header chrome — frosted, pinned above the scrolling scene. */
export function TabHeaderBackground() {
  const colors = useAppColors();

  if (Platform.OS === 'ios') {
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <BlurView
          intensity={Math.max(colors.blurIntensity, 50)}
          tint={colors.blurTint}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surfaceSolid }]} />
      </View>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surfaceSolid }]}
      pointerEvents="none"
    />
  );
}
