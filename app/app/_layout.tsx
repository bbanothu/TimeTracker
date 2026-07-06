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
import { getAppHeaderOptions } from '@/navigation/headerOptions';
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
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ title: '' }} />
              <Stack.Screen name="(tabs)" options={{ title: '' }} />
              <Stack.Screen
                name="profile"
                options={{
                  headerShown: true,
                  title: 'Account',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="friends"
                options={{
                  headerShown: true,
                  title: 'Friends',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="change-password"
                options={{
                  headerShown: true,
                  title: 'Password',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="history"
                options={{
                  headerShown: true,
                  title: 'History',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="progress"
                options={{
                  headerShown: true,
                  title: 'Progress',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="about"
                options={{
                  headerShown: true,
                  title: 'About',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="contact"
                options={{
                  headerShown: true,
                  title: 'Contact',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="privacy"
                options={{
                  headerShown: true,
                  title: 'Privacy',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
              <Stack.Screen
                name="terms"
                options={{
                  headerShown: true,
                  title: 'Terms',
                  headerBackTitle: '',
                  headerBackButtonDisplayMode: 'minimal',
                  ...getAppHeaderOptions(colors),
                }}
              />
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
