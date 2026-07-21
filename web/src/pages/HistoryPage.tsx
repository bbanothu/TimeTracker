import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { EditEntryModal } from '@/components/ui/EditEntryModal';
import { EntryList } from '@/components/ui/EntryList';
import { HistoryPagination } from '@/components/ui/HistoryPagination';
import { PageLoading } from '@/components/ui/PageLoading';
import { HistoryFilters } from '@/components/ui/HistoryFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import {
  deleteTimeEntry,
  fetchAllEntries,
  fetchGeofences,
  mergeTimeEntries,
  updateTimeEntry,
} from '@/services/data';
import type { Geofence, TimeEntry } from '@/types';
import { buildMergedFields } from '@/utils/entryMerge';
import {
  defaultHistoryFilters,
  filterHistoryEntries,
  hasActiveHistoryFilters,
  HISTORY_PAGE_SIZE,
  paginateHistoryEntries,
  type HistoryFilterState,
} from '@/utils/historyFilters';
import { filterAnalyticsVisibleItems, isTagIncludedInAnalytics } from '@/utils/tagAnalytics';

export function HistoryPage() {
  const colors = useAppColors();
  const location = useLocation();
  const { user } = useAuth();
  const { tags } = useTags();
  const { ready, entriesRevision, refresh } = useTimer();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [page, setPage] = useState(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allEntries, allGeofences] = await Promise.all([
        fetchAllEntries(user.id),
        fetchGeofences(user.id),
      ]);
      setEntries(allEntries);
      setGeofences(allGeofences);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready || location.pathname !== '/profile/history') return;
    loadEntries().catch(console.error);
  }, [ready, location.pathname, entriesRevision, loadEntries]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      loadEntries().catch(console.error);
    });
  }, [user, loadEntries]);

  const filteredEntries = useMemo(() => {
    const visible = filterAnalyticsVisibleItems(entries);
    return filterHistoryEntries(visible, filters);
  }, [entries, filters]);

  useEffect(() => {
    if (
      filters.tagId &&
      !tags.some((tag) => tag.id === filters.tagId && isTagIncludedInAnalytics(tag))
    ) {
      setFilters((current) => ({ ...current, tagId: null }));
    }
  }, [filters.tagId, tags]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const {
    items: pagedEntries,
    page: safePage,
    totalPages,
  } = useMemo(() => paginateHistoryEntries(filteredEntries, page), [filteredEntries, page]);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const geofenceNames = useMemo(
    () => new Map(geofences.map((geofence) => [geofence.id, geofence.name])),
    [geofences],
  );

  const handleDelete = async (entryId: string) => {
    if (!user) return;

    try {
      setError(null);
      await deleteTimeEntry(user.id, entryId);
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSaveEdit = async (
    entryId: string,
    tagIds: string[],
    startedAt: number,
    endedAt: number,
    details: string | null,
  ) => {
    if (!user) return;

    await updateTimeEntry(user.id, entryId, { startedAt, endedAt, tagIds, details });
    notifyDataRefresh();
    await loadEntries();
    await refresh();
  };

  const handleMerge = async (keepEntryId: string, deleteEntryId: string) => {
    if (!user) return;

    const older = entries.find((entry) => entry.id === keepEntryId);
    const newer = entries.find((entry) => entry.id === deleteEntryId);
    if (!older || !newer) return;

    try {
      setError(null);
      const fields = buildMergedFields(older, newer);
      await mergeTimeEntries(
        user.id,
        keepEntryId,
        deleteEntryId,
        older.tags.map((tag) => tag.id),
        fields,
      );
      notifyDataRefresh();
      await loadEntries();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    }
  };

  if (!ready || loading) {
    return <PageLoading />;
  }

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  const rangeStart = filteredEntries.length === 0 ? 0 : safePage * HISTORY_PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * HISTORY_PAGE_SIZE, filteredEntries.length);

  return (
    <div>
      <PageHeader title="History" backLink={{ to: '/profile', label: '← Back' }} />

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <HistoryFilters tags={tags} geofences={geofences} filters={filters} onChange={setFilters} />

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        {filteredEntries.length === 0
          ? `0 of ${entries.length} records`
          : `Showing ${rangeStart}–${rangeEnd} of ${filteredEntries.length} records`}
      </p>
      <EntryList
        entries={pagedEntries}
        emptyMessage={emptyMessage}
        geofenceNames={geofenceNames}
        showDate
        onEdit={setEditingEntry}
        onDelete={handleDelete}
        onMerge={handleMerge}
      />
      <HistoryPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />

      <EditEntryModal
        visible={editingEntry !== null}
        entry={editingEntry}
        tags={tags}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
