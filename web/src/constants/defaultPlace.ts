export const UNKNOWN_PLACE_NAME = 'unknown';

export const DEFAULT_UNKNOWN_PLACE = {
  tagName: UNKNOWN_PLACE_NAME,
  geofenceName: UNKNOWN_PLACE_NAME,
  tagColor: '#64748B',
  latitude: 0,
  longitude: 0,
  radiusMeters: 0,
} as const;

export function isUnknownPlaceName(name: string): boolean {
  return name.trim().toLowerCase() === UNKNOWN_PLACE_NAME;
}

export function isUnknownGeofence(geofence: { name: string }): boolean {
  return isUnknownPlaceName(geofence.name);
}

export function filterDisplayGeofences<T extends { name: string }>(geofences: T[]): T[] {
  return geofences.filter((geofence) => !isUnknownGeofence(geofence));
}
