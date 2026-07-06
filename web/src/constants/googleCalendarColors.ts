/** Google Calendar event palette — IDs 1–11 map 1:1 to these hex values in the API. */
export const GOOGLE_EVENT_COLORS = [
  { id: '1', name: 'Lavender', hex: '#a4bdfc' },
  { id: '2', name: 'Sage', hex: '#7ae7bf' },
  { id: '3', name: 'Grape', hex: '#dbadff' },
  { id: '4', name: 'Flamingo', hex: '#ff887c' },
  { id: '5', name: 'Banana', hex: '#fbd75b' },
  { id: '6', name: 'Tangerine', hex: '#ffb878' },
  { id: '7', name: 'Peacock', hex: '#46d6db' },
  { id: '8', name: 'Graphite', hex: '#e1e1e1' },
  { id: '9', name: 'Blueberry', hex: '#5484ed' },
  { id: '10', name: 'Basil', hex: '#51b749' },
  { id: '11', name: 'Tomato', hex: '#dc2127' },
] as const;

export type GoogleEventColor = (typeof GOOGLE_EVENT_COLORS)[number];

export const TAG_COLOR_OPTIONS = GOOGLE_EVENT_COLORS.map((color) => color.hex);

export const DEFAULT_TAG_COLORS = {
  work: '#51b749',
  personal: '#ffb878',
  sleep: '#dbadff',
  unknown: '#e1e1e1',
} as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function nearestGoogleColorHex(hex: string): string {
  const exact = GOOGLE_EVENT_COLORS.find(
    (color) => color.hex.toLowerCase() === hex.trim().toLowerCase(),
  );
  if (exact) return exact.hex;

  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_TAG_COLORS.unknown;

  let best: GoogleEventColor = GOOGLE_EVENT_COLORS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of GOOGLE_EVENT_COLORS) {
    const candidate = hexToRgb(color.hex);
    if (!candidate) continue;
    const distance =
      (rgb.r - candidate.r) ** 2 + (rgb.g - candidate.g) ** 2 + (rgb.b - candidate.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }
  return best.hex;
}

export function googleColorIdForHex(hex: string): string {
  const snapped = nearestGoogleColorHex(hex);
  const match = GOOGLE_EVENT_COLORS.find((color) => color.hex === snapped);
  return match?.id ?? '8';
}

export function googleColorNameForHex(hex: string): string {
  const snapped = nearestGoogleColorHex(hex);
  const match = GOOGLE_EVENT_COLORS.find((color) => color.hex === snapped);
  return match?.name ?? 'Graphite';
}
