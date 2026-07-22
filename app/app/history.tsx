import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryList } from '@/components/EntryList';
import { HistoryFilters } from '@/components/HistoryFilters';
import { HistoryPagination } from '@/components/HistoryPagination';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import {
  deleteEntry,
  getAllGeofences,
  getHistoryEntriesPage,
  getTimeEntryByIdForHistory,
  mergeEntries,
  updateEntry,
} from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/hooks/useAuth';
import { useTags } from '@/hooks/useTags';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { TimeEntry } from '@/types';
import { buildMergedFields } from '@/utils/entryMerge';
import {
  defaultHistoryFilters,
  getHistoryDateRange,
  hasActiveHistoryFilters,
  HISTORY_PAGE_SIZE,
  type HistoryFilterState,
} from '@/utils/historyFilters';
import { isTagIncludedInAnalytics } from '@/utils/tagAnalytics';

export default function HistoryScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { tags } = useTags();
  const { ready, entriesRevision } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [page, setPage] = useState(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const geofences = useMemo(() => (ready ? getAllGeofences() : []), [ready, entriesRevision]);

  const loadPage = useCallback(
    (pageToLoad: number) => {
      if (!ready) return;
      const result = getHistoryEntriesPage(
        filters,
        pageToLoad,
        HISTORY_PAGE_SIZE,
        getHistoryDateRange(filters.datePreset),
      );
      setEntries(result.entries);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      if (result.page !== pageToLoad) {
        setPage(result.page);
      }
    },
    [ready, filters],
  );

  useEffect(() => {
    loadPage(page);
  }, [loadPage, page, entriesRevision]);

  useEffect(() => {
    if (
      filters.tagId &&
      !tags.some((tag) => tag.id === filters.tagId && isTagIncludedInAnalytics(tag))
    ) {
      setFilters((current) => ({ ...current, tagId: null }));
      setPage(0);
    }
  }, [filters.tagId, tags]);

  const handleFiltersChange = (next: HistoryFilterState) => {
    setFilters(next);
    setPage(0);
  };

  const geofenceNames = useMemo(
    () => new Map(geofences.map((geofence) => [geofence.id, geofence.name])),
    [geofences],
  );

  const handleDelete = (entryId: string) => {
    try {
      deleteEntry(entryId);
      pushChangesInBackground(user?.id);
      notifyDataRefresh();
    } catch (error) {
      loadPage(page);
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
    pushChangesInBackground(user?.id);
    notifyDataRefresh();
  };

  const handleMerge = (keepEntryId: string, deleteEntryId: string) => {
    const older = getTimeEntryByIdForHistory(keepEntryId);
    const newer = getTimeEntryByIdForHistory(deleteEntryId);
    if (!older || !newer) return;

    try {
      mergeEntries(keepEntryId, deleteEntryId, buildMergedFields(older, newer));
      pushChangesInBackground(user?.id);
      notifyDataRefresh();
    } catch (error) {
      loadPage(page);
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  const rangeStart = totalCount === 0 ? 0 : page * HISTORY_PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * HISTORY_PAGE_SIZE, totalCount);

  return (
    <AppBackground>
      <TabScreenContainer>
        <TabScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          cloudPull="none"
          pageHeader
          pageTitle="History"
          showBack
          onRefreshExtra={() => {
            loadPage(page);
          }}
        >
          <HistoryFilters
            tags={tags}
            geofences={geofences}
            filters={filters}
            onChange={handleFiltersChange}
          />

          <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
            {totalCount === 0
              ? '0 records'
              : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} records`}
          </Text>
          <EntryList
            entries={entries}
            emptyMessage={emptyMessage}
            geofenceNames={geofenceNames}
            showDate
            onEdit={setEditingEntry}
            onDelete={handleDelete}
            onMerge={handleMerge}
          />
          <HistoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
