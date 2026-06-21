import '../global.css';
import '@/tasks/geofenceTask';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <ActivityIndicator size="large" />
      <Text className="mt-3 text-slate-500 dark:text-slate-400">Loading...</Text>
    </View>
  );
}

function RootNavigator() {
  const { isDark } = useTheme();
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
            headerStyle: { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            headerTintColor: isDark ? '#F8FAFC' : '#0F172A',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 20,
              color: isDark ? '#F8FAFC' : '#0F172A',
            },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
