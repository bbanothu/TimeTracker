import * as Location from 'expo-location';

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(query: string): Promise<GeocodedLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const results = await Location.geocodeAsync(trimmed);
  if (results.length === 0) return null;

  return {
    latitude: results[0].latitude,
    longitude: results[0].longitude,
  };
}
