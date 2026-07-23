import { useEffect, useMemo, useState } from 'react';
import { alarmOutline } from 'ionicons/icons';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoading } from '@/components/ui/PageLoading';
import { AddManualSessionModal } from '@/components/ui/AddManualSessionModal';
import { ActiveSessionsList } from '@/components/ui/ActiveSessionsList';
import { AppIcon } from '@/components/ui/AppIcon';
import { EntryList } from '@/components/ui/EntryList';
import { StartAlarmModal } from '@/components/ui/StartAlarmModal';
import { StartSessionButton } from '@/components/ui/SessionControlButtons';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { TimerDisplay } from '@/components/ui/TimerDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useSelectedTag } from '@/hooks/useSelectedTag';
import { StopSessionDetailsModal } from '@/components/ui/StopSessionDetailsModal';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { buildMergedFields } from '@/utils/entryMerge';
import { clipDurationMs, getPeriodBounds } from '@/utils/periodBounds';
import { fetchGeofences, mergeTimeEntries, updateTimeEntryStopDetails } from '@/services/data';
import {
  analyticsVisibleDurationMs,
  filterAnalyticsVisibleItems,
  isAnalyticsVisibleItem,
} from '@/utils/tagAnalytics';

export function TrackPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const {
    ready,
    sessions,
    todayEntries,
    tick,
    startManual,
    startAlarm,
    extendAlarm,
    stop,
    addManualEntry,
    refresh,
  } = useTimer();
  const { tags } = useTags();
  const { selectedTagId, setSelectedTagId } = useSelectedTag(tags);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [stopDetailsEntryId, setStopDetailsEntryId] = useState<string | null>(null);
  const [savingStopDetails, setSavingStopDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofenceNames, setGeofenceNames] = useState<Map<string, string>>(new Map());

  const visibleTodayEntries = useMemo(
    () => filterAnalyticsVisibleItems(todayEntries),
    [todayEntries],
  );

  const heroElapsedMs = useMemo(() => {
    const now = Date.now();
    const { start, end } = getPeriodBounds(new Date(), 'day');
    const rangeStart = start.getTime();
    const rangeEnd = end.getTime();

    const todayCompletedMs = todayEntries.reduce((sum, entry) => {
      if (entry.endedAt == null) return sum;
      return (
        sum +
        analyticsVisibleDurationMs(
          clipDurationMs(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
          entry.tags,
        )
      );
    }, 0);
    const activeVisibleMs = sessions.map((session) => {
      const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
      return analyticsVisibleDurationMs(
        clipDurationMs(session.startedAt, now, rangeStart, rangeEnd),
        sessionTags,
      );
    });
    const activeMs = activeVisibleMs.length === 0 ? 0 : Math.max(...activeVisibleMs);
    return todayCompletedMs + activeMs;
  }, [todayEntries, sessions, tags, tick]);

  const isHeroRunning = useMemo(
    () =>
      sessions.some((session) => {
        const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
        return isAnalyticsVisibleItem({ tags: sessionTags });
      }),
    [sessions, tags],
  );

  useEffect(() => {
    if (!user) return;

    const ids = new Set<string>();
    for (const session of sessions) {
      if (session.geofenceId) ids.add(session.geofenceId);
    }
    for (const entry of visibleTodayEntries) {
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
  }, [user, sessions, visibleTodayEntries]);

  if (!ready) {
    return <PageLoading />;
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

  const handleStartAlarm = async (tagIds: string[], alarmAt: number) => {
    setError(null);
    await startAlarm(tagIds, alarmAt);
  };

  const handleExtendAlarm = async (sessionId: string, extraMs: number) => {
    try {
      setError(null);
      await extendAlarm(sessionId, extraMs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to extend alarm');
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

  const handleMerge = async (keepEntryId: string, deleteEntryId: string) => {
    if (!user) return;

    const older = visibleTodayEntries.find((entry) => entry.id === keepEntryId);
    const newer = visibleTodayEntries.find((entry) => entry.id === deleteEntryId);
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
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    }
  };

  return (
    <div>
      <PageHeader title="Track" />

      <div className="mb-2 flex justify-center pt-1">
        <TimerDisplay elapsedMs={heroElapsedMs} isRunning={isHeroRunning} />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div>
          <ThemedSurface className="mb-6 p-4 lg:mb-4">
            <p
              className="mb-2 text-[13px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Start session
            </p>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
              </div>
              <StartSessionButton onClick={handleStart} disabled={!selectedTagId} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setAlarmModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-[15px] font-semibold transition hover:opacity-80"
                style={{
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.glass,
                  color: colors.textOnBg,
                }}
              >
                <AppIcon icon={alarmOutline} size={18} color={colors.textOnBg} />
                Start alarm
              </button>
              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="flex flex-1 items-center justify-center rounded-xl border py-3 text-[15px] font-semibold transition hover:opacity-80"
                style={{
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.glass,
                  color: colors.textOnBg,
                }}
              >
                Log session
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
          </ThemedSurface>

          <p
            className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Active ({sessions.length})
          </p>
          {sessions.length > 0 ? (
            <section className="mb-4">
              <ActiveSessionsList
                sessions={sessions}
                tags={tags}
                geofenceNames={geofenceNames}
                tick={tick}
                onStop={handleStop}
                onExtendAlarm={handleExtendAlarm}
              />
            </section>
          ) : (
            <ThemedSurface className="mb-4 px-4 py-5">
              <p className="text-center text-[15px]" style={{ color: colors.textMuted }}>
                No active sessions
              </p>
            </ThemedSurface>
          )}
        </div>

        <section className="lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <p
            className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Today ({visibleTodayEntries.length})
          </p>
          <EntryList
            entries={visibleTodayEntries}
            emptyMessage="No tracked time yet today."
            geofenceNames={geofenceNames}
            onMerge={handleMerge}
          />
        </section>
      </div>

      <AddManualSessionModal
        visible={manualModalOpen}
        tags={tags}
        onClose={() => setManualModalOpen(false)}
        onSave={addManualEntry}
      />

      <StartAlarmModal
        visible={alarmModalOpen}
        tags={tags}
        initialTagId={selectedTagId}
        onClose={() => setAlarmModalOpen(false)}
        onStart={handleStartAlarm}
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
