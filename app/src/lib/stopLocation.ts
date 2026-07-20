import * as Location from 'expo-location';

export interface StopCoordinates {
  latitude: number;
  longitude: number;
}

export async function getStopCoordinates(): Promise<StopCoordinates | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      const requested = await Location.requestForegroundPermissionsAsync();
      if (requested.status !== Location.PermissionStatus.GRANTED) {
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function stopSessionWithLocation(
  sessionId: string,
  stopSession: (
    id: string,
    options?: {
      stopLatitude?: number | null;
      stopLongitude?: number | null;
    },
  ) => import('@/types').TimeEntry | null,
) {
  const coords = await getStopCoordinates();
  return stopSession(sessionId, {
    stopLatitude: coords?.latitude ?? null,
    stopLongitude: coords?.longitude ?? null,
  });
}
