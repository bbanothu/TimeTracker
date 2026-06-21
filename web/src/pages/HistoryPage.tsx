import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EntryList } from '@/components/ui/EntryList';
import { HistoryFilters } from '@/components/ui/HistoryFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useTimer } from '@/contexts/TimerContext';
import { deleteTimeEntry, fetchAllEntries, fetchGeofences } from '@/services/data';
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
    if (!ready || location.pathname !== '/history') return;
    loadEntries().catch(console.error);
  }, [ready, location.pathname, entriesRevision, loadEntries]);

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
    if (!window.confirm('Remove this tracked session permanently?')) return;

    try {
      setError(null);
      await deleteTimeEntry(user.id, entryId);
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!ready || loading) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  const emptyMessage = hasActiveHistoryFilters(filters)
    ? 'No records match these filters.'
    : 'Nothing recorded yet.';

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        History
      </h1>

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
        onDelete={handleDelete}
      />
    </div>
  );
}
