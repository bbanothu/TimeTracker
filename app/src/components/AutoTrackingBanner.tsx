import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { useGeofenceMonitoring } from '@/hooks/useGeofenceMonitoring';
import { useAppColors } from '@/hooks/useAppColors';

const DISMISSED_ACTIVE_KEY = 'timetracker-dismissed-autotracking-active';
const DISMISSED_FOREGROUND_KEY = 'timetracker-dismissed-autotracking-foreground';

interface AutoTrackingBannerProps {
  className?: string;
}

export function AutoTrackingBanner({ className = '' }: AutoTrackingBannerProps) {
  const colors = useAppColors();
  const { status, enabledCount, isExpoGo, enabling, enableBackgroundTracking } =
    useGeofenceMonitoring();
  const [dismissedExpoGo, setDismissedExpoGo] = useState(false);
  const [dismissedActive, setDismissedActive] = useState(false);
  const [dismissedForeground, setDismissedForeground] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [active, foreground] = await Promise.all([
          AsyncStorage.getItem(DISMISSED_ACTIVE_KEY),
          AsyncStorage.getItem(DISMISSED_FOREGROUND_KEY),
        ]);
        if (cancelled) return;
        setDismissedActive(active === '1');
        setDismissedForeground(foreground === '1');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissActive = () => {
    setDismissedActive(true);
    AsyncStorage.setItem(DISMISSED_ACTIVE_KEY, '1').catch(console.warn);
  };

  const dismissForeground = () => {
    setDismissedForeground(true);
    AsyncStorage.setItem(DISMISSED_FOREGROUND_KEY, '1').catch(console.warn);
  };

  if (!loaded || enabledCount === 0) return null;

  if (isExpoGo && !dismissedExpoGo) {
    return (
      <View
        className={`border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950 ${className}`}
      >
        <Text className="text-sm text-amber-900 dark:text-amber-200">
          Expo Go limits background location. Use a development build for reliable auto-tracking
          when the app is closed.
        </Text>
        <Pressable onPress={() => setDismissedExpoGo(true)} className="mt-2">
          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">Dismiss</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'background_active') {
    if (dismissedActive) return null;

    return (
      <View
        className={`border-b px-4 py-3 ${className}`}
        style={{
          backgroundColor: `${colors.primary}14`,
          borderColor: `${colors.primary}33`,
        }}
      >
        <Text className="text-sm font-medium" style={{ color: colors.text }}>
          Auto-tracking is on for {enabledCount} saved {enabledCount === 1 ? 'place' : 'places'} —
          even when the app is closed.
        </Text>
        <Pressable onPress={dismissActive} className="mt-2">
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            Dismiss
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleEnable = () => {
    enableBackgroundTracking()
      .then((granted) => {
        if (granted) return;

        Alert.alert(
          'Always Allow location required',
          'Open Settings, choose Location, then Always Allow so TimeTracker can auto-start when you arrive at saved places.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      })
      .catch(console.warn);
  };

  if (status === 'location_denied') {
    return (
      <View
        className={`border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950 ${className}`}
      >
        <Text className="text-sm text-amber-900 dark:text-amber-200">
          Location access is off. Allow location to use auto-tracking at your saved places.
        </Text>
        <Pressable onPress={() => Linking.openSettings()} className="mt-2">
          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Open Settings
          </Text>
        </Pressable>
      </View>
    );
  }

  if (dismissedForeground) return null;

  return (
    <View
      className={`border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950 ${className}`}
    >
      <Text className="text-sm text-amber-900 dark:text-amber-200">
        Auto-tracking only runs while the app is open. Enable Always Allow location to track
        arrivals when the app is closed.
      </Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-4">
        <Pressable onPress={handleEnable} disabled={enabling}>
          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {enabling ? 'Enabling…' : 'Enable background auto-tracking'}
          </Text>
        </Pressable>
        <Pressable onPress={dismissForeground}>
          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}
