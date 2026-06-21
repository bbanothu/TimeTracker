import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { getGeofenceById } from '@/db/client';
import type { TimeEntry } from '@/types';

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',');
}

export async function exportEntriesToCsv(entries: TimeEntry[]): Promise<void> {
  const header = formatCsvRow([
    'started_at',
    'ended_at',
    'duration_minutes',
    'source',
    'tags',
    'geofence_id',
    'geofence_name',
  ]);

  const rows = entries.map((entry) => {
    const durationMinutes = ((entry.endedAt - entry.startedAt) / 60000).toFixed(2);
    const tags = entry.tags.map((tag) => tag.name).join('; ');
    const geofenceName = entry.geofenceId
      ? (getGeofenceById(entry.geofenceId)?.name ?? '')
      : '';

    return formatCsvRow([
      new Date(entry.startedAt).toISOString(),
      new Date(entry.endedAt).toISOString(),
      durationMinutes,
      entry.source,
      tags,
      entry.geofenceId ?? '',
      geofenceName,
    ]);
  });

  const csv = [header, ...rows].join('\n');
  const filename = `timetracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const path = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: 'Export time entries',
    UTI: 'public.comma-separated-values-text',
  });
}
