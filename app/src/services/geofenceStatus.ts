import * as Location from 'expo-location';

import { getTrackableGeofences } from '@/db/client';
import {
  GEOFENCE_TASK,
  hasBackgroundLocationPermission,
  requestLocationPermissions,
} from '@/services/geofenceService';

export type AutoTrackingStatus =
  'inactive' | 'background_active' | 'foreground_only' | 'location_denied';

export interface AutoTrackingState {
  status: AutoTrackingStatus;
  enabledCount: number;
  backgroundGranted: boolean;
  foregroundGranted: boolean;
  geofencingActive: boolean;
}

export async function getAutoTrackingState(): Promise<AutoTrackingState> {
  const enabledCount = getTrackableGeofences().length;
  const foregroundGranted =
    (await Location.getForegroundPermissionsAsync()).status === Location.PermissionStatus.GRANTED;
  const backgroundGranted = await hasBackgroundLocationPermission();
  const geofencingActive = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);

  if (enabledCount === 0) {
    return {
      status: 'inactive',
      enabledCount,
      backgroundGranted,
      foregroundGranted,
      geofencingActive,
    };
  }

  if (!foregroundGranted) {
    return {
      status: 'location_denied',
      enabledCount,
      backgroundGranted,
      foregroundGranted,
      geofencingActive,
    };
  }

  if (backgroundGranted && geofencingActive) {
    return {
      status: 'background_active',
      enabledCount,
      backgroundGranted,
      foregroundGranted,
      geofencingActive,
    };
  }

  return {
    status: 'foreground_only',
    enabledCount,
    backgroundGranted,
    foregroundGranted,
    geofencingActive,
  };
}

export async function ensureForegroundLocationPermission(): Promise<boolean> {
  return requestLocationPermissions();
}
