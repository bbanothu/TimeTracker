import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ActiveSessionsList } from '@/components/ActiveSessionsList';
import { AddManualSessionModal } from '@/components/AddManualSessionModal';
import { EntryList } from '@/components/EntryList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagDropdown } from '@/components/TagDropdown';
import { ThemedSurface } from '@/components/ThemedSurface';
import { StopSessionDetailsModal } from '@/components/StopSessionDetailsModal';
import { getGeofenceById, updateEntryStopDetails } from '@/db/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useSelectedTag } from '@/hooks/useSelectedTag';
import { useTags } from '@/hooks/useTags';
import { getStopCoordinates } from '@/lib/stopLocation';
import { dismissGeofenceNotification } from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { timerService } from '@/services/timerService';

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

  void tick;

  const geofenceNames = useMemo(() => {
    if (!ready) return new Map<string, string>();

    const map = new Map<string, string>();
    const ids = new Set<string>();

    for (const session of sessions) {
      if (session.geofenceId) ids.add(session.geofenceId);
    }
    for (const entry of todayEntries) {
      if (entry.geofenceId) ids.add(entry.geofenceId);
    }

    for (const id of ids) {
      const geofence = getGeofenceById(id);
      if (geofence) map.set(id, geofence.name);
    }

    return map;
  }, [ready, sessions, todayEntries]);

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

  return (
    <TabScreenContainer>
      <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <ThemedSurface className="mb-6 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-2xl font-medium" style={{ color: colors.textMuted }}>
              Start new session
            </Text>
            <Pressable
              onPress={() => setManualModalOpen(true)}
              accessibilityLabel="Add past session"
              accessibilityRole="button"
              className="rounded-full p-1 active:opacity-70"
            >
              <Ionicons name="add-circle-outline" size={34} color={colors.primary} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
            </View>
            <Pressable
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel="Start session"
              className="items-center justify-center rounded-full active:opacity-80"
              style={{
                width: 28,
                height: 28,
                borderWidth: 2.5,
                borderColor: colors.primary,
                backgroundColor: 'transparent',
              }}
            >
              <Ionicons name="play" size={12} color={colors.primary} style={{ marginLeft: 1 }} />
            </Pressable>
          </View>
        </ThemedSurface>

        {sessions.length > 0 ? (
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium" style={{ color: colors.textMuted }}>
              Active ({sessions.length})
            </Text>
            <ActiveSessionsList
              sessions={sessions}
              geofenceNames={geofenceNames}
              onStop={handleStop}
            />
          </View>
        ) : (
          <Text className="mb-4 text-center text-base" style={{ color: colors.textMuted }}>
            No active sessions yet.
          </Text>
        )}

        <Text className="mb-2 text-base font-medium" style={{ color: colors.textMuted }}>
          Today ({todayEntries.length})
        </Text>
        <EntryList
          entries={todayEntries}
          emptyMessage="No tracked time yet today."
          geofenceNames={geofenceNames}
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
