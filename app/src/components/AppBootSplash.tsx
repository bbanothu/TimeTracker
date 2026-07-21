import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AppBackground } from '@/components/AppBackground';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAppColors } from '@/hooks/useAppColors';
import { buildProfileDisplayName, fetchMyProfile } from '@/services/profileService';

function welcomeName(firstName: string, lastName: string, email: string): string | null {
  const first = firstName.trim();
  if (first) return first;

  const full = buildProfileDisplayName({ firstName, lastName });
  if (full) return full.split(/\s+/)[0] ?? null;

  const local = email.split('@')[0]?.trim();
  return local || null;
}

export function AppBootSplash() {
  const colors = useAppColors();
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);

    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setName(welcomeName(profile.firstName, profile.lastName, profile.email));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    Animated.timing(opacity, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [ready, opacity]);

  return (
    <AppBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-end px-6">
          {ready ? (
            <Animated.View className="items-center" style={{ opacity }}>
              <Text
                className="text-center text-3xl font-semibold tracking-wide"
                style={{ color: colors.text }}
              >
                Welcome back
              </Text>
              {name ? (
                <Text
                  className="mt-2 text-center text-2xl font-medium tracking-wide"
                  style={{ color: colors.textMuted }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
        <View className="items-center">
          <LoadingIndicator size="large" />
        </View>
        <View className="flex-1" />
      </SafeAreaView>
    </AppBackground>
  );
}
