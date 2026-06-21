import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EntryList } from '@/components/EntryList';
import { TagDropdown } from '@/components/TagDropdown';
import { TimerDisplay } from '@/components/TimerDisplay';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useTags } from '@/hooks/useTags';
import { formatTagName } from '@/utils/formatDuration';

export default function TrackScreen() {
  const { ready, session, todayEntries, startManual, stop } = useActiveSession();
  const { tags } = useTags();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const isRunning = !!session;
  const isManualSession = session?.source === 'manual';

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

  const handleStop = () => {
    stop();
  };

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Text className="text-slate-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="px-4 pb-8 pt-2"
    >
      <TimerDisplay startedAt={session?.startedAt ?? null} isRunning={isRunning} />

      {session ? (
        <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
          <Text className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Active session
          </Text>
          <View className="flex-row flex-wrap">
            {session.tags.map((tag) => (
              <Text key={tag.id} className="mr-2 text-base font-semibold" style={{ color: tag.color }}>
                {formatTagName(tag.name)}
              </Text>
            ))}
          </View>
          <Text className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {session.source}
          </Text>
        </View>
      ) : (
        <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
          <Text className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Activity</Text>
          <TagDropdown
            tags={tags}
            selectedId={selectedTagId}
            onSelect={setSelectedTagId}
          />
        </View>
      )}

      <View className="mb-6 flex-row gap-3">
        {!isRunning ? (
          <Pressable onPress={handleStart} className="flex-1 rounded-2xl bg-blue-600 py-4">
            <Text className="text-center text-base font-semibold text-white">Start</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleStop}
            disabled={!isManualSession && session?.source === 'geofence'}
            className={`flex-1 rounded-2xl py-4 ${
              isManualSession ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <Text className="text-center text-base font-semibold text-white">
              {isManualSession ? 'Stop' : 'Auto tracking'}
            </Text>
          </Pressable>
        )}
      </View>

      <Text className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Today</Text>
      <EntryList entries={todayEntries} emptyMessage="No tracked time yet today." />
    </ScrollView>
  );
}
