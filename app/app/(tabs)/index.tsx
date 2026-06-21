import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { EntryList } from '@/components/EntryList';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagDropdown } from '@/components/TagDropdown';
import { ThemedSurface } from '@/components/ThemedSurface';
import { TimerDisplay } from '@/components/TimerDisplay';
import { getGeofenceById } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';
import { formatTagName } from '@/utils/formatDuration';

export default function TrackScreen() {
  const { ready, session, todayEntries, startManual, stop } = useActiveSession();
  const { tags } = useTags();
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const isRunning = !!session;
  const activeGeofence = session?.geofenceId ? getGeofenceById(session.geofenceId) : null;

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
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <TimerDisplay startedAt={session?.startedAt ?? null} isRunning={isRunning} />

        {session ? (
          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
              Active session
            </Text>
            <View className="flex-row flex-wrap">
              {session.tags.map((tag) => (
                <Text
                  key={tag.id}
                  className="mr-2 text-base font-semibold"
                  style={{ color: tag.color }}
                >
                  {formatTagName(tag.name)}
                </Text>
              ))}
            </View>
            {session.source === 'geofence' && activeGeofence ? (
              <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                at {activeGeofence.name}
              </Text>
            ) : null}
            <Text className="mt-2 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
              {session.source === 'geofence' ? 'Location tracking' : session.source}
            </Text>
          </ThemedSurface>
        ) : (
          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-sm font-medium" style={{ color: colors.textMuted }}>
              Activity
            </Text>
            <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
          </ThemedSurface>
        )}

        <View className="mb-6 flex-row gap-3">
          {!isRunning ? (
            <ActionButton label="Start" onPress={handleStart} size="lg" className="flex-1" />
          ) : (
            <ActionButton
              label="Stop"
              onPress={stop}
              variant="destructive"
              size="lg"
              className="flex-1"
            />
          )}
        </View>

        <Text className="mb-3 text-lg font-semibold" style={{ color: colors.textOnBg }}>
          Today
        </Text>
        <EntryList entries={todayEntries} emptyMessage="No tracked time yet today." />
      </ScrollView>
    </TabScreenContainer>
  );
}
