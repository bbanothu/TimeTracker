import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface AuthCardProps {
  children: React.ReactNode;
}

const RADIUS = 20;

export function AuthCard({ children }: AuthCardProps) {
  const colors = useAppColors();

  if (Platform.OS === 'ios') {
    return (
      <View
        style={{
          borderRadius: RADIUS,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassBorder,
        }}
      >
        <BlurView
          intensity={Math.max(colors.blurIntensity, 40)}
          tint={colors.blurTint}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ padding: 20, backgroundColor: colors.glass }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: RADIUS,
        backgroundColor: colors.surfaceSolid,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
      }}
    >
      <View style={{ padding: 20 }}>{children}</View>
    </View>
  );
}
