import { BlurView } from 'expo-blur';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

const defaultSource = require('../../assets/login1.jpg');

interface AppBackgroundProps {
  children: React.ReactNode;
  source?: ImageSource;
}

export function AppBackground({ children, source = defaultSource }: AppBackgroundProps) {
  const colors = useAppColors();

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Image
        source={source}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        pointerEvents="none"
      />
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={colors.blurIntensity}
          tint={colors.blurTint}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFillObject, styles.androidOverlay]}
          pointerEvents="none"
        />
      )}
      <LinearGradient
        colors={colors.backgroundGradient}
        locations={[0, 0.45, 1]}
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
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
