import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';

export interface GeofenceTagGroup {
  key: string;
  tagLabel: string;
  tagColor: string;
  geofences: Geofence[];
}

export function groupGeofencesByTag(geofences: Geofence[]): GeofenceTagGroup[] {
  const byTag = new Map<string, Geofence[]>();

  for (const geofence of geofences) {
    const existing = byTag.get(geofence.tagId) ?? [];
    existing.push(geofence);
    byTag.set(geofence.tagId, existing);
  }

  return [...byTag.entries()]
    .map(([key, groupGeofences]) => {
      const sorted = [...groupGeofences].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
      const first = sorted[0];

      return {
        key,
        tagLabel: formatTagName(first?.tag?.name ?? 'tag'),
        tagColor: first?.tag?.color ?? '#64748B',
        geofences: sorted,
      };
    })
    .sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' }));
}

export function tagGroupSubtitle(geofences: Geofence[]): string {
  if (geofences.length === 2) {
    return geofences.map((geofence) => geofence.name).join(', ');
  }
  return `${geofences.length} places`;
}
