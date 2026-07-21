import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ActiveSessionsList } from '@/components/ActiveSessionsList';
import { AddManualSessionModal } from '@/components/AddManualSessionModal';
import { AutoTrackingBanner } from '@/components/AutoTrackingBanner';
import { EntryList } from '@/components/EntryList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagDropdown } from '@/components/TagDropdown';
import { ThemedSurface } from '@/components/ThemedSurface';
import { TimerDisplay } from '@/components/TimerDisplay';
import { StopSessionDetailsModal } from '@/components/StopSessionDetailsModal';
import { getGeofenceById, mergeEntries, updateEntryStopDetails } from '@/db/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useSelectedTag } from '@/hooks/useSelectedTag';
import { useTags } from '@/hooks/useTags';
import { getStopCoordinates } from '@/lib/stopLocation';
import { dismissGeofenceNotification } from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { timerService } from '@/services/timerService';
import { isActiveUnknownSession, suppressUnknownAutoTracking } from '@/services/geofenceService';
import { buildMergedFields } from '@/utils/entryMerge';
import { clipDurationMs, getPeriodBounds } from '@/utils/periodBounds';
import {
  analyticsVisibleDurationMs,
  filterAnalyticsVisibleItems,
  isAnalyticsVisibleItem,
} from '@/utils/tagAnalytics';

export default function TrackScreen() {
  const { user } = useAuth();
  const { ready, sessions, todayEntries, tick, startManual, addManualEntry, refresh } =
    useActiveSession();
  const { tags } = useTags();
  const { selectedTagId, setSelectedTagId } = useSelectedTag(tags);
  const colors = useAppColors();
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [stopDetailsEntryId, setStopDetailsEntryId] = useState<string | null>(null);
  const [savingStopDetails, setSavingStopDetails] = useState(false);

  const visibleTodayEntries = useMemo(
    () => filterAnalyticsVisibleItems(todayEntries),
    [todayEntries],
  );

  const geofenceNames = useMemo(() => {
    if (!ready) return new Map<string, string>();

    const map = new Map<string, string>();
    const ids = new Set<string>();

    for (const session of sessions) {
      if (session.geofenceId) ids.add(session.geofenceId);
    }
    for (const entry of visibleTodayEntries) {
      if (entry.geofenceId) ids.add(entry.geofenceId);
    }

    for (const id of ids) {
      const geofence = getGeofenceById(id);
      if (geofence) map.set(id, geofence.name);
    }

    return map;
  }, [ready, sessions, visibleTodayEntries]);

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

    const activeVisibleMs = sessions.map((session) =>
      analyticsVisibleDurationMs(
        clipDurationMs(session.startedAt, now, rangeStart, rangeEnd),
        session.tags,
      ),
    );
    const activeMs = activeVisibleMs.length === 0 ? 0 : Math.max(...activeVisibleMs);
    return todayCompletedMs + activeMs;
  }, [todayEntries, sessions, tick]);

  const handleStart = () => {
    try {
      if (!selectedTagId) {
        Alert.alert('Select activity', 'Choose a tag from the dropdown before starting.');
        return;
      }
      startManual([selectedTagId]);
    } catch (error) {
      Alert.alert('Unable to start', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleStop = async (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (session && isActiveUnknownSession(session)) {
      suppressUnknownAutoTracking();
    }
    const coords = await getStopCoordinates();
    const entry = timerService.stop(sessionId, {
      stopLatitude: coords?.latitude ?? null,
      stopLongitude: coords?.longitude ?? null,
    });
    refresh();
    if (session?.geofenceId) {
      dismissGeofenceNotification(session.geofenceId).catch(console.warn);
    }
    if (user) {
      pushChangesInBackground(user.id);
    }
    if (entry) {
      setStopDetailsEntryId(entry.id);
    }
  };

  const handleSaveStopDetails = async (details: string) => {
    if (!stopDetailsEntryId) return;

    try {
      setSavingStopDetails(true);
      updateEntryStopDetails(stopDetailsEntryId, { details: details || null });
      setStopDetailsEntryId(null);
      refresh();
      if (user) {
        pushChangesInBackground(user.id);
      }
    } finally {
      setSavingStopDetails(false);
    }
  };

  const handleMerge = (keepEntryId: string, deleteEntryId: string) => {
    const older = visibleTodayEntries.find((entry) => entry.id === keepEntryId);
    const newer = visibleTodayEntries.find((entry) => entry.id === deleteEntryId);
    if (!older || !newer) return;

    try {
      mergeEntries(keepEntryId, deleteEntryId, buildMergedFields(older, newer));
      refresh();
      notifyDataRefresh();
      if (user) {
        pushChangesInBackground(user.id);
      }
    } catch (error) {
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <TabScreenContainer>
      <TabScrollView className="flex-1" contentContainerClassName="pb-8">
        <AutoTrackingBanner className="-mx-4" />
        <View className="mb-6 items-center pt-2">
          <TimerDisplay
            elapsedMs={heroElapsedMs}
            isRunning={sessions.some(isAnalyticsVisibleItem)}
          />
        </View>

        <ThemedSurface className="mb-6 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-[13px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Start session
            </Text>
            <Pressable
              onPress={() => setManualModalOpen(true)}
              accessibilityLabel="Add past session"
              accessibilityRole="button"
              className="rounded-full p-1 active:opacity-70"
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
            </View>
            <Pressable
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel="Start session"
              className="items-center justify-center rounded-full active:opacity-80"
              style={{
                width: 52,
                height: 52,
                backgroundColor: colors.primary,
              }}
            >
              <Ionicons
                name="play"
                size={22}
                color={colors.textOnPrimary}
                style={{ marginLeft: 2 }}
              />
            </Pressable>
          </View>
        </ThemedSurface>

        <Text
          className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide"
          style={{ color: colors.textMuted }}
        >
          Active ({sessions.length})
        </Text>
        {sessions.length > 0 ? (
          <ActiveSessionsList
            sessions={sessions}
            geofenceNames={geofenceNames}
            onStop={handleStop}
          />
        ) : (
          <ThemedSurface className="mb-4 px-4 py-5">
            <Text className="text-center text-[15px]" style={{ color: colors.textMuted }}>
              No active sessions
            </Text>
          </ThemedSurface>
        )}

        <Text
          className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide"
          style={{ color: colors.textMuted }}
        >
          Today ({visibleTodayEntries.length})
        </Text>
        <EntryList
          entries={visibleTodayEntries}
          emptyMessage="No tracked time yet today."
          geofenceNames={geofenceNames}
          onMerge={handleMerge}
        />
      </TabScrollView>

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
    </TabScreenContainer>
  );
}
