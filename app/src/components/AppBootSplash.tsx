import { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AppBackground } from '@/components/AppBackground';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAppColors } from '@/hooks/useAppColors';

export function AppBootSplash() {
  const colors = useAppColors();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <AppBackground>
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        <Text className="mb-8 text-3xl font-semibold tracking-wide" style={{ color: colors.text }}>
          TimeTracker
        </Text>
        <LoadingIndicator size="large" />
      </SafeAreaView>
    </AppBackground>
  );
}
