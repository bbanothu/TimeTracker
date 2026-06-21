import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EntryList } from '@/components/ui/EntryList';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTimer } from '@/contexts/TimerContext';
import { deleteTimeEntry, fetchAllEntries, fetchGeofences } from '@/services/data';
import type { TimeEntry } from '@/types';

export function HistoryPage() {
  const colors = useAppColors();
  const location = useLocation();
  const { user } = useAuth();
  const { ready, entriesRevision, refresh } = useTimer();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofenceNames, setGeofenceNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allEntries, geofences] = await Promise.all([
        fetchAllEntries(user.id),
        fetchGeofences(user.id),
      ]);
      setEntries(allEntries);
      setGeofenceNames(new Map(geofences.map((g) => [g.id, g.name])));
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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        History
      </h1>

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        All records ({entries.length})
      </p>
      <EntryList
        entries={entries}
        emptyMessage="Nothing recorded yet."
        geofenceNames={geofenceNames}
        showDate
        onDelete={handleDelete}
      />
    </div>
  );
}
