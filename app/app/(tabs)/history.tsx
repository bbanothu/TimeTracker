import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import { EntryList } from '@/components/EntryList';
import { HistoryFilters } from '@/components/HistoryFilters';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { deleteEntry, getAllEntries, getAllGeofences, getGeofenceById } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import type { TimeEntry } from '@/types';
import {
  defaultHistoryFilters,
  filterHistoryEntries,
  hasActiveHistoryFilters,
  type HistoryFilterState,
} from '@/utils/historyFilters';

export default function HistoryScreen() {
  const colors = useAppColors();
  const { tags } = useTags();
  const { ready, entriesRevision } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const geofences = useMemo(() => (ready ? getAllGeofences() : []), [ready, entriesRevision]);

  useEffect(() => {
    if (!ready) return;
    setEntries([...getAllEntries()].reverse());
  }, [ready, entriesRevision]);

  const filteredEntries = useMemo(
    () => filterHistoryEntries(entries, filters),
    [entries, filters],
  );

  const geofenceNames = useMemo(() => {
    if (!ready) return new Map<string, string>();

    const map = new Map<string, string>();
    for (const entry of entries) {
      if (!entry.geofenceId || map.has(entry.geofenceId)) continue;
      const geofence = getGeofenceById(entry.geofenceId);
      if (geofence) map.set(entry.geofenceId, geofence.name);
    }
    return map;
  }, [ready, entries]);

  const handleDelete = (entryId: string) => {
    Alert.alert('Delete entry', 'Remove this tracked session permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteEntry(entryId);
            notifyDataRefresh();
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </TabScreenContainer>
    );
  }

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  return (
    <TabScreenContainer>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <HistoryFilters tags={tags} geofences={geofences} filters={filters} onChange={setFilters} />

        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          {filteredEntries.length} of {entries.length} records
        </Text>
        <EntryList
          entries={filteredEntries}
          emptyMessage={emptyMessage}
          geofenceNames={geofenceNames}
          showDate
          onDelete={handleDelete}
        />
      </ScrollView>
    </TabScreenContainer>
  );
}
