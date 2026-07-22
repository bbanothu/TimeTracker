import '../global.css';
import '@/tasks/geofenceTask';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppBootGate } from '@/components/AppBootGate';
import { AppBootSplash } from '@/components/AppBootSplash';
import { TimerProvider } from '@/hooks/useActiveSession';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { TagsProvider } from '@/hooks/useTags';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { getStackScreenOptions } from '@/navigation/headerOptions';
import {
  registerNotificationResponseHandler,
  setupNotifications,
} from '@/services/notificationService';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { isDark } = useTheme();
  const colors = useAppColors();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  useEffect(() => {
    setupNotifications().catch(console.warn);
  }, []);

  useEffect(() => {
    if (!session) return;
    return registerNotificationResponseHandler(() => router.push('/(tabs)'));
  }, [session, router]);

  if (loading) {
    return <AppBootSplash />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TimerProvider>
        <TagsProvider>
          <AppBootGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.pageBg },
              }}
            >
              <Stack.Screen name="(auth)" options={{ title: '' }} />
              <Stack.Screen name="(tabs)" options={{ title: '' }} />
              <Stack.Screen name="profile" options={{ title: 'Account' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="history" options={{ title: 'History' }} />
              <Stack.Screen name="friends" options={{ title: 'Friends' }} />
              <Stack.Screen name="change-password" options={{ title: 'Password' }} />
              <Stack.Screen name="about" options={getStackScreenOptions(colors, 'About')} />
              <Stack.Screen name="contact" options={getStackScreenOptions(colors, 'Contact')} />
              <Stack.Screen name="support" options={getStackScreenOptions(colors, 'Support')} />
              <Stack.Screen name="privacy" options={getStackScreenOptions(colors, 'Privacy')} />
              <Stack.Screen name="terms" options={getStackScreenOptions(colors, 'Terms')} />
            </Stack>
          </AppBootGate>
        </TagsProvider>
      </TimerProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
