import { useEffect } from 'react';
import { Text, View } from 'react-native';
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
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-end ">
          <Text className="text-3xl font-semibold tracking-wide" style={{ color: colors.text }}>
            TimeTracker
          </Text>
        </View>
        <View className="items-center">
          <LoadingIndicator size="large" />
        </View>
        <View className="flex-1" />
      </SafeAreaView>
    </AppBackground>
  );
}
