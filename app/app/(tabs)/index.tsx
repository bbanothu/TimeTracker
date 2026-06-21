import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ActiveSessionsList } from '@/components/ActiveSessionsList';
import { ActionButton } from '@/components/ActionButton';
import { EntryList } from '@/components/EntryList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagDropdown } from '@/components/TagDropdown';
import { ThemedSurface } from '@/components/ThemedSurface';
import { getGeofenceById } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';

export default function TrackScreen() {
  const { ready, sessions, todayEntries, tick, startManual, stop } = useActiveSession();
  const { tags } = useTags();
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

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

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }

    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

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

  if (!ready) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer>
      <TabScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <ThemedSurface className="mb-6 p-4">
          <Text className="mb-3 text-sm font-medium" style={{ color: colors.textMuted }}>
            Start new session
          </Text>
          <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
          <View className="mt-4">
            <ActionButton label="Start" onPress={handleStart} size="lg" />
          </View>
        </ThemedSurface>

        {sessions.length > 0 ? (
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
              Active ({sessions.length})
            </Text>
            <ActiveSessionsList sessions={sessions} geofenceNames={geofenceNames} onStop={stop} />
          </View>
        ) : (
          <Text className="mb-4 text-center text-sm" style={{ color: colors.textMuted }}>
            No active sessions yet.
          </Text>
        )}

        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          Today ({todayEntries.length})
        </Text>
        <EntryList
          entries={todayEntries}
          emptyMessage="No tracked time yet today."
          geofenceNames={geofenceNames}
        />
      </TabScrollView>
    </TabScreenContainer>
  );
}
