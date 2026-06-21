import { FlatList, Text, View } from 'react-native';

import { formatDurationLong, formatTagName } from '@/utils/formatDuration';
import type { TimeEntry } from '@/types';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
}

export function EntryList({ entries, emptyMessage = 'No entries yet' }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <Text className="py-4 text-center text-slate-500 dark:text-slate-400">{emptyMessage}</Text>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const duration = item.endedAt - item.startedAt;
        const tagLabel = item.tags.map((tag) => formatTagName(tag.name)).join(' ');

        return (
          <View className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tagLabel || 'Untagged'}
              </Text>
              <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {formatDurationLong(duration)}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(item.startedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {' – '}
                {new Date(item.endedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <View
                className={`rounded-full px-2 py-1 ${
                  item.source === 'geofence'
                    ? 'bg-violet-100 dark:bg-violet-950'
                    : 'bg-sky-100 dark:bg-sky-950'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    item.source === 'geofence'
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-sky-700 dark:text-sky-300'
                  }`}
                >
                  {item.source}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}
