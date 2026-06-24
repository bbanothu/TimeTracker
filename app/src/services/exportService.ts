import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import type { Tag, TimeEntry } from '@/types';
import { buildAggregatedExportCsv } from '@/utils/aggregatedExportCsv';

export async function exportEntriesToCsv(
  entries: TimeEntry[],
  tags: Tag[],
  personName: string,
): Promise<void> {
  const csv = buildAggregatedExportCsv(entries, tags, personName);
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
