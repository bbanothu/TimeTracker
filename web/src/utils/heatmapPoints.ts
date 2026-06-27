import { getPeriodBounds } from '@/utils/periodBounds';
import type { Geofence, PeriodType, TimeEntry } from '@/types';

export type HeatmapPoint = [latitude: number, longitude: number, intensity: number];

const MIN_INTENSITY = 0.1;
const MAX_INTENSITY = 480;

export interface HeatmapSummary {
  sessionCount: number;
  totalDurationMs: number;
  points: HeatmapPoint[];
}

function resolveEntryCoordinates(
  entry: TimeEntry,
  geofenceById: Map<string, Geofence>,
): [latitude: number, longitude: number] | null {
  if (entry.stopLatitude != null && entry.stopLongitude != null) {
    return [entry.stopLatitude, entry.stopLongitude];
  }

  if (entry.geofenceId) {
    const geofence = geofenceById.get(entry.geofenceId);
    if (geofence) {
      return [geofence.latitude, geofence.longitude];
    }
  }

  return null;
}

export function buildHeatmapSummary(
  entries: TimeEntry[],
  geofences: Geofence[],
  anchorDate: Date,
  period: PeriodType,
): HeatmapSummary {
  const { start, end } = getPeriodBounds(anchorDate, period);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const geofenceById = new Map(geofences.map((geofence) => [geofence.id, geofence]));

  const filtered = entries.filter((entry): entry is TimeEntry & { endedAt: number } => {
    if (entry.endedAt == null || entry.endedAt < startMs || entry.endedAt > endMs) return false;
    return resolveEntryCoordinates(entry, geofenceById) != null;
  });

  let totalDurationMs = 0;
  const rawPoints: HeatmapPoint[] = filtered.map((entry) => {
    const coords = resolveEntryCoordinates(entry, geofenceById)!;
    const durationMs = Math.max(0, entry.endedAt - entry.startedAt);
    totalDurationMs += durationMs;
    const minutes = durationMs / 60_000;
    const intensity = Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, minutes));
    return [coords[0], coords[1], intensity];
  });

  const points = aggregateHeatmapPoints(rawPoints);

  return {
    sessionCount: filtered.length,
    totalDurationMs,
    points,
  };
}

/** Merge sessions at the same spot and lightly bucket nearby points for smoother heat. */
function aggregateHeatmapPoints(points: HeatmapPoint[]): HeatmapPoint[] {
  const buckets = new Map<string, { lat: number; lng: number; intensity: number; count: number }>();

  for (const [lat, lng, intensity] of points) {
    // ~350m grid cells — merge nearby activity into connected blobs
    const key = `${(lat * 250).toFixed(0)}:${(lng * 250).toFixed(0)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.intensity += intensity;
      existing.count += 1;
      existing.lat += lat;
      existing.lng += lng;
    } else {
      buckets.set(key, { lat, lng, intensity, count: 1 });
    }
  }

  return Array.from(buckets.values()).map(({ lat, lng, intensity, count }) => [
    lat / count,
    lng / count,
    Math.min(MAX_INTENSITY, intensity),
  ]);
}
