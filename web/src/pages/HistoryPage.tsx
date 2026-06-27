import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { EditEntryModal } from '@/components/ui/EditEntryModal';
import { EntryList } from '@/components/ui/EntryList';
import { HistoryFilters } from '@/components/ui/HistoryFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { deleteTimeEntry, fetchAllEntries, fetchGeofences, updateTimeEntry } from '@/services/data';
import type { Geofence, TimeEntry } from '@/types';
import {
  defaultHistoryFilters,
  filterHistoryEntries,
  hasActiveHistoryFilters,
  type HistoryFilterState,
} from '@/utils/historyFilters';

export function HistoryPage() {
  const colors = useAppColors();
  const location = useLocation();
  const { user } = useAuth();
  const { tags } = useTags();
  const { ready, entriesRevision, refresh } = useTimer();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
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

  const filteredEntries = useMemo(
    () => filterHistoryEntries(entries, filters),
    [entries, filters],
  );

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

  if (!ready || loading) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/profile" className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          ← Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: colors.headerText }}>
          History
        </h1>
        <span className="w-10" />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <HistoryFilters tags={tags} geofences={geofences} filters={filters} onChange={setFilters} />

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        {filteredEntries.length} of {entries.length} records
      </p>
      <EntryList
        entries={filteredEntries}
        emptyMessage={emptyMessage}
        geofenceNames={geofenceNames}
        showDate
        onEdit={setEditingEntry}
        onDelete={handleDelete}
      />

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
