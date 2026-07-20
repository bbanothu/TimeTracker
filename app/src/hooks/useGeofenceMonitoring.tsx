import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { subscribeDataRefresh } from '@/lib/dataRefresh';
import {
  checkForegroundGeofences,
  requestBackgroundPermissions,
  syncGeofencingTask,
  disableBackgroundGeofencing,
  reconcileUnknownSession,
} from '@/services/geofenceService';
import {
  ensureForegroundLocationPermission,
  getAutoTrackingState,
  type AutoTrackingState,
} from '@/services/geofenceStatus';

const FOREGROUND_POLL_MS = 15_000;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

interface GeofenceMonitoringContextValue extends AutoTrackingState {
  isExpoGo: boolean;
  enabling: boolean;
  refreshStatus: () => Promise<void>;
  enableBackgroundTracking: () => Promise<boolean>;
  disableBackgroundTracking: () => Promise<void>;
}

const GeofenceMonitoringContext = createContext<GeofenceMonitoringContextValue | null>(null);

interface GeofenceMonitoringProviderProps {
  ready: boolean;
  onRegionChange: () => void;
  children: React.ReactNode;
}

export function GeofenceMonitoringProvider({
  ready,
  onRegionChange,
  children,
}: GeofenceMonitoringProviderProps) {
  const insideIdsRef = useRef<Set<string>>(new Set());
  const [state, setState] = useState<AutoTrackingState>({
    status: 'inactive',
    enabledCount: 0,
    backgroundGranted: false,
    foregroundGranted: false,
    geofencingActive: false,
  });
  const [enabling, setEnabling] = useState(false);
  const isExpoGo = Constants.appOwnership === 'expo';

  const refreshStatus = useCallback(async () => {
    setState(await getAutoTrackingState());
  }, []);

  const runForegroundCheck = useCallback(async () => {
    const granted = await ensureForegroundLocationPermission();
    if (!granted) {
      await refreshStatus();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await reconcileUnknownSession();
      const previous = insideIdsRef.current;
      const next = await checkForegroundGeofences(
        location.coords.latitude,
        location.coords.longitude,
        previous,
      );
      insideIdsRef.current = next;

      if (!setsEqual(previous, next)) {
        onRegionChange();
      }
    } catch (error) {
      console.warn('Foreground geofence check failed:', error);
    }

    await refreshStatus();
  }, [onRegionChange, refreshStatus]);

  const enableBackgroundTracking = useCallback(async () => {
    setEnabling(true);
    try {
      const granted = await requestBackgroundPermissions();
      if (granted) {
        await syncGeofencingTask();
      }
      await refreshStatus();
      return granted;
    } finally {
      setEnabling(false);
    }
  }, [refreshStatus]);

  const disableBackgroundTracking = useCallback(async () => {
    setEnabling(true);
    try {
      await disableBackgroundGeofencing();
      await refreshStatus();
    } finally {
      setEnabling(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (!ready) return;

    refreshStatus().catch(console.warn);
    runForegroundCheck().catch(console.warn);

    const poll = setInterval(() => {
      runForegroundCheck().catch(console.warn);
    }, FOREGROUND_POLL_MS);

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runForegroundCheck().catch(console.warn);
      }
    };

    const appStateSub = AppState.addEventListener('change', onAppStateChange);
    const dataRefreshUnsub = subscribeDataRefresh(() => {
      refreshStatus().catch(console.warn);
    });

    return () => {
      clearInterval(poll);
      appStateSub.remove();
      dataRefreshUnsub();
    };
  }, [ready, refreshStatus, runForegroundCheck]);

  const value = useMemo(
    () => ({
      ...state,
      isExpoGo,
      enabling,
      refreshStatus,
      enableBackgroundTracking,
      disableBackgroundTracking,
    }),
    [state, isExpoGo, enabling, refreshStatus, enableBackgroundTracking, disableBackgroundTracking],
  );

  return (
    <GeofenceMonitoringContext.Provider value={value}>
      {children}
    </GeofenceMonitoringContext.Provider>
  );
}

export function useGeofenceMonitoring() {
  const context = useContext(GeofenceMonitoringContext);
  if (!context) {
    throw new Error('useGeofenceMonitoring must be used within GeofenceMonitoringProvider');
  }
  return context;
}
