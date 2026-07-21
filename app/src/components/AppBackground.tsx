import { BlurView } from 'expo-blur';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { useTheme } from '@/hooks/useTheme';

const defaultSource = require('../../assets/login1.jpg');

interface AppBackgroundProps {
  children: React.ReactNode;
  source?: ImageSource;
}

/** Atmospheric photo + wash so frosted glass has something real to blur. */
export function AppBackground({ children, source = defaultSource }: AppBackgroundProps) {
  const colors = useAppColors();
  const { isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.pageBg }]} pointerEvents="box-none">
      <Image
        source={source}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        pointerEvents="none"
      />
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={isDark ? 72 : 48}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)' },
          ]}
          pointerEvents="none"
        />
      )}
      <LinearGradient
        colors={colors.backgroundGradient}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
