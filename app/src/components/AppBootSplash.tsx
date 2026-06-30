import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';

import { AppBackground } from '@/components/AppBackground';
import { useAppColors } from '@/hooks/useAppColors';

const loadingAnimation = require('../../assets/loading.json');

const LOADING_SIZE = 220;

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
        <View style={{ width: LOADING_SIZE, height: LOADING_SIZE }}>
          <LottieView
            source={loadingAnimation}
            autoPlay
            loop
            style={{ width: LOADING_SIZE, height: LOADING_SIZE }}
          />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}
