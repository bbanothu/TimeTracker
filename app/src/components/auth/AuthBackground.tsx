import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/AppBackground';

interface AuthBackgroundProps {
  children: React.ReactNode;
  source?: unknown;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
