import { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryList } from '@/components/EntryList';
import { HistoryFilters } from '@/components/HistoryFilters';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { deleteEntry, getAllEntries, getAllGeofences, getGeofenceById, updateEntry } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/hooks/useAuth';
import { useTags } from '@/hooks/useTags';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { TimeEntry } from '@/types';
import {
  defaultHistoryFilters,
  filterHistoryEntries,
  hasActiveHistoryFilters,
  type HistoryFilterState,
} from '@/utils/historyFilters';

export default function HistoryScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { tags } = useTags();
  const { ready, entriesRevision } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
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
    try {
      deleteEntry(entryId);
      notifyDataRefresh();
      pushChangesInBackground(user?.id);
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSaveEdit = (
    entryId: string,
    tagIds: string[],
    startedAt: number,
    endedAt: number,
  ) => {
    updateEntry(entryId, tagIds, startedAt, endedAt);
    notifyDataRefresh();
    pushChangesInBackground(user?.id);
  };

  if (!ready) {
    return (
      <AppBackground>
        <TabScreenContainer className="items-center justify-center">
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </TabScreenContainer>
      </AppBackground>
    );
  }

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  return (
    <AppBackground>
      <TabScreenContainer>
        <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
          <HistoryFilters tags={tags} geofences={geofences} filters={filters} onChange={setFilters} />

          <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
            {filteredEntries.length} of {entries.length} records
          </Text>
          <EntryList
            entries={filteredEntries}
            emptyMessage={emptyMessage}
            geofenceNames={geofenceNames}
            showDate
            onEdit={setEditingEntry}
            onDelete={handleDelete}
          />
        </TabScrollView>

        <EditEntryModal
          visible={editingEntry !== null}
          entry={editingEntry}
          tags={tags}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEdit}
        />
      </TabScreenContainer>
    </AppBackground>
  );
}
