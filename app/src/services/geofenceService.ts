import * as Location from 'expo-location';

import {
  getActiveSessionByGeofenceId,
  getCurrentUserId,
  getEnabledGeofences,
  getGeofenceById,
} from '@/db/client';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { getStopCoordinates } from '@/lib/stopLocation';
import {
  dismissGeofenceNotification,
  showGeofenceEnterNotification,
} from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { timerService } from '@/services/timerService';

export const GEOFENCE_TASK = 'IRLDAY_GEOFENCE';

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideGeofence(
  latitude: number,
  longitude: number,
  geofence: { latitude: number; longitude: number; radiusMeters: number },
): boolean {
  return (
    distanceMeters(latitude, longitude, geofence.latitude, geofence.longitude) <=
    geofence.radiusMeters
  );
}

export async function handleGeofenceEnter(geofenceId: string): Promise<void> {
  try {
    const geofence = getGeofenceById(geofenceId);
    if (!geofence || !geofence.enabled) return;

    const active = getActiveSessionByGeofenceId(geofenceId);
    if (active) return;

    timerService.startGeofence(geofence.tagId, geofenceId);

    const tagName = geofence.tag?.name ?? 'activity';
    await showGeofenceEnterNotification(geofenceId, geofence.name, tagName);
    notifyDataRefresh();
    pushChangesInBackground(getCurrentUserId());
  } catch (error) {
    console.warn('Geofence enter failed:', error);
  }
}

export async function handleGeofenceExit(geofenceId: string): Promise<void> {
  try {
    const active = getActiveSessionByGeofenceId(geofenceId);
    if (!active) return;

    const coords = await getStopCoordinates();
    timerService.stop(active.id, {
      stopLatitude: coords?.latitude ?? null,
      stopLongitude: coords?.longitude ?? null,
    });
    await dismissGeofenceNotification(geofenceId);
    notifyDataRefresh();
    pushChangesInBackground(getCurrentUserId());
  } catch (error) {
    console.warn('Geofence exit failed:', error);
  }
}

export async function hasBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function syncGeofencingTask(): Promise<void> {
  try {
    const geofences = getEnabledGeofences();
    const regions: Location.LocationRegion[] = geofences.map((g) => ({
      identifier: g.id,
      latitude: g.latitude,
      longitude: g.longitude,
      radius: g.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (regions.length === 0) {
      if (hasStarted) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
      }
      return;
    }

    const backgroundGranted = await hasBackgroundLocationPermission();
    if (!backgroundGranted) {
      if (hasStarted) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
      }
      return;
    }

    if (hasStarted) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  } catch (error) {
    console.warn('Geofence sync unavailable:', error);
  }
}

export async function disableBackgroundGeofencing(): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (hasStarted) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch (error) {
    console.warn('Geofence stop unavailable:', error);
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  return foreground === Location.PermissionStatus.GRANTED;
}

export async function requestBackgroundPermissions(): Promise<boolean> {
  const foregroundOk = await requestLocationPermissions();
  if (!foregroundOk) return false;

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return background === Location.PermissionStatus.GRANTED;
}

export async function checkForegroundGeofences(
  latitude: number,
  longitude: number,
  insideIds: Set<string>,
): Promise<Set<string>> {
  const geofences = getEnabledGeofences();
  const nextInside = new Set<string>();

  for (const geofence of geofences) {
    const inside = isInsideGeofence(latitude, longitude, geofence);
    if (inside) {
      nextInside.add(geofence.id);
      if (!insideIds.has(geofence.id)) {
        await handleGeofenceEnter(geofence.id);
      }
    } else if (insideIds.has(geofence.id)) {
      await handleGeofenceExit(geofence.id);
    }
  }

  return nextInside;
}

export const geofenceService = {
  syncGeofencingTask,
  hasBackgroundLocationPermission,
  requestLocationPermissions,
  requestBackgroundPermissions,
  checkForegroundGeofences,
  handleGeofenceEnter,
  handleGeofenceExit,
  isInsideGeofence,
};
