export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(query: string): Promise<GeocodedLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'IrlDay/1.0 (contact: support@irlday.local)',
    },
  });

  if (!response.ok) {
    throw new Error('Address lookup failed');
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!Array.isArray(results) || results.length === 0) return null;

  return {
    latitude: Number.parseFloat(results[0].lat),
    longitude: Number.parseFloat(results[0].lon),
  };
}
