import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryList } from '@/components/EntryList';
import { HistoryFilters } from '@/components/HistoryFilters';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import {
  deleteEntry,
  getAllEntries,
  getAllGeofences,
  getGeofenceById,
  mergeEntries,
  updateEntry,
} from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/hooks/useAuth';
import { useTags } from '@/hooks/useTags';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { TimeEntry } from '@/types';
import {
  defaultHistoryFilters,
  filterHistoryEntries,
  hasActiveHistoryFilters,
  type HistoryFilterState,
} from '@/utils/historyFilters';
import { buildMergedFields } from '@/utils/entryMerge';

export default function HistoryScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { tags } = useTags();
  const { ready, entriesRevision } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const geofences = useMemo(() => (ready ? getAllGeofences() : []), [ready, entriesRevision]);

  const reloadEntries = useCallback(() => {
    if (!ready) return;
    setEntries([...getAllEntries()].reverse());
  }, [ready]);

  useEffect(() => {
    reloadEntries();
  }, [reloadEntries, entriesRevision]);

  useEffect(() => {
    if (!ready) return;
    return subscribeDataRefresh(reloadEntries);
  }, [ready, reloadEntries]);

  const filteredEntries = useMemo(() => filterHistoryEntries(entries, filters), [entries, filters]);

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
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      notifyDataRefresh();
      pushChangesInBackground(user?.id);
    } catch (error) {
      reloadEntries();
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSaveEdit = (
    entryId: string,
    tagIds: string[],
    startedAt: number,
    endedAt: number,
    details: string | null,
  ) => {
    updateEntry(entryId, tagIds, startedAt, endedAt, details);
    notifyDataRefresh();
    pushChangesInBackground(user?.id);
  };

  const handleMerge = (keepEntryId: string, deleteEntryId: string) => {
    const older = entries.find((entry) => entry.id === keepEntryId);
    const newer = entries.find((entry) => entry.id === deleteEntryId);
    if (!older || !newer) return;

    try {
      const merged = mergeEntries(keepEntryId, deleteEntryId, buildMergedFields(older, newer));
      setEntries((current) =>
        current
          .filter((entry) => entry.id !== deleteEntryId)
          .map((entry) => (entry.id === keepEntryId ? merged : entry)),
      );
      notifyDataRefresh();
      pushChangesInBackground(user?.id);
    } catch (error) {
      reloadEntries();
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  return (
    <AppBackground>
      <TabScreenContainer>
        <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
          <HistoryFilters
            tags={tags}
            geofences={geofences}
            filters={filters}
            onChange={setFilters}
          />

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
            onMerge={handleMerge}
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
