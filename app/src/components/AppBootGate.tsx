import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppBootSplash } from '@/components/AppBootSplash';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';

const STATS_VIZ_STORAGE_KEY = 'irlday-stats-viz';

export function AppBootGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { ready } = useActiveSession();
  const [prefsReady, setPrefsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(!!user);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STATS_VIZ_STORAGE_KEY).finally(() => setPrefsReady(true));
  }, []);

  const bootComplete = !!user && ready && prefsReady;

  useEffect(() => {
    if (!user) {
      setShowSplash(false);
      return;
    }

    if (!bootComplete) {
      setShowSplash(true);
      opacity.setValue(1);
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowSplash(false);
    });
  }, [user, bootComplete, opacity]);

  return (
    <View style={styles.root}>
      {children}
      {showSplash ? (
        <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity }]}>
          <AppBootSplash />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
