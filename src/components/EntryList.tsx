import { FlatList, Text, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
}

export function EntryList({ entries, emptyMessage = 'No entries yet' }: EntryListProps) {
  const colors = useAppColors();

  if (entries.length === 0) {
    return (
      <Text className="py-4 text-center" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
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
          <ThemedSurface className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {tagLabel || 'Untagged'}
              </Text>
              <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                {formatDurationLong(duration)}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs" style={{ color: colors.textMuted }}>
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
                className="rounded-full px-2 py-1"
                style={{ backgroundColor: colors.selectedBg }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.selectedText }}>
                  {item.source}
                </Text>
              </View>
            </View>
          </ThemedSurface>
        );
      }}
    />
  );
}
