import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/AppBackground';
import type { ImageSource } from 'expo-image';

interface AuthBackgroundProps {
  children: React.ReactNode;
  source?: ImageSource;
}

export function AuthBackground({ children, source }: AuthBackgroundProps) {
  return (
    <AppBackground source={source}>
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
