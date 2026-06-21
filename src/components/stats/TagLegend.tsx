import { Text, View } from 'react-native';

import { formatDurationLong, formatTagName } from '@/utils/formatDuration';
import type { TagDuration } from '@/types';

interface TagLegendProps {
  items: TagDuration[];
  compact?: boolean;
}

export function TagLegend({ items, compact }: TagLegendProps) {
  if (items.length === 0) return null;

  return (
    <View className={compact ? 'mt-3 w-full' : 'mt-4 w-full'}>
      {items.map((item) => (
        <View key={item.tag.id} className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View
              className="mr-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <Text
              className="text-sm text-slate-700 dark:text-slate-300"
              numberOfLines={1}
            >
              {formatTagName(item.tag.name)}
            </Text>
          </View>
          {!compact ? (
            <Text className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatDurationLong(item.durationMs)}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
