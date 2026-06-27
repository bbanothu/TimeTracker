import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { AddManualSessionModal } from '@/components/ui/AddManualSessionModal';
import { ActiveSessionsList } from '@/components/ui/ActiveSessionsList';
import { EntryList } from '@/components/ui/EntryList';
import { StartSessionButton } from '@/components/ui/SessionControlButtons';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { StopSessionDetailsModal } from '@/components/ui/StopSessionDetailsModal';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { fetchGeofences, updateTimeEntryStopDetails } from '@/services/data';

export function TrackPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { ready, sessions, todayEntries, tick, startManual, stop, addManualEntry } = useTimer();
  const { tags } = useTags();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [stopDetailsEntryId, setStopDetailsEntryId] = useState<string | null>(null);
  const [savingStopDetails, setSavingStopDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofenceNames, setGeofenceNames] = useState<Map<string, string>>(new Map());

  void tick;

  useEffect(() => {
    if (!user) return;

    const ids = new Set<string>();
    for (const session of sessions) {
      if (session.geofenceId) ids.add(session.geofenceId);
    }
    for (const entry of todayEntries) {
      if (entry.geofenceId) ids.add(entry.geofenceId);
    }

    if (ids.size === 0) {
      setGeofenceNames(new Map());
      return;
    }

    fetchGeofences(user.id)
      .then((geofences) => {
        const map = new Map<string, string>();
        for (const geofence of geofences) {
          if (ids.has(geofence.id)) map.set(geofence.id, geofence.name);
        }
        setGeofenceNames(map);
      })
      .catch(console.error);
  }, [user, sessions, todayEntries]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  if (!ready) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  const handleStart = async () => {
    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose a tag before starting.');
        return;
      }
      await startManual([selectedTagId]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start');
    }
  };

  const handleStop = async (sessionId: string) => {
    try {
      const entryId = await stop(sessionId);
      if (entryId) {
        setStopDetailsEntryId(entryId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStopDetails = async (details: string) => {
    if (!user || !stopDetailsEntryId) return;

    try {
      setSavingStopDetails(true);
      await updateTimeEntryStopDetails(user.id, stopDetailsEntryId, {
        details: details || null,
      });
      setStopDetailsEntryId(null);
      notifyDataRefresh();
    } finally {
      setSavingStopDetails(false);
    }
  };

  return (
    <div>
      <PageHeader title="Track" />

      <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div>
          <ThemedSurface className="mb-6 p-4 lg:mb-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-2xl font-medium" style={{ color: colors.textMuted }}>
                Start new session
              </p>
              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                aria-label="Add past session"
                className="rounded-full p-1 transition hover:opacity-70"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="1.5" />
                  <path
                    d="M12 8v8M8 12h8"
                    stroke={colors.primary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
              </div>
              <StartSessionButton onClick={handleStart} disabled={!selectedTagId} />
            </div>
            {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
          </ThemedSurface>

          {sessions.length > 0 ? (
            <section className="mb-4">
              <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
                Active ({sessions.length})
              </p>
              <ActiveSessionsList
                sessions={sessions}
                tags={tags}
                geofenceNames={geofenceNames}
                onStop={handleStop}
              />
            </section>
          ) : (
            <p className="mb-4 text-center text-sm lg:mb-0" style={{ color: colors.textMuted }}>
              No active sessions yet.
            </p>
          )}
        </div>

        <section className="lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <p className="mb-2 text-sm font-medium lg:text-base" style={{ color: colors.textMuted }}>
            Today ({todayEntries.length})
          </p>
          <EntryList
            entries={todayEntries}
            emptyMessage="No tracked time yet today."
            geofenceNames={geofenceNames}
          />
        </section>
      </div>

      <AddManualSessionModal
        visible={manualModalOpen}
        tags={tags}
        onClose={() => setManualModalOpen(false)}
        onSave={addManualEntry}
      />

      <StopSessionDetailsModal
        visible={stopDetailsEntryId != null}
        onClose={() => setStopDetailsEntryId(null)}
        onSave={handleSaveStopDetails}
        saving={savingStopDetails}
      />
    </div>
  );
}
