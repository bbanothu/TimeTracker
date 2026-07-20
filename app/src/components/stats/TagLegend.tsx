import { Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';
import type { TagDuration } from '@/types';

interface TagLegendProps {
  items: TagDuration[];
  compact?: boolean;
}

export function TagLegend({ items, compact }: TagLegendProps) {
  const colors = useAppColors();

  if (items.length === 0) return null;

  return (
    <View className={compact ? 'mt-3 w-full' : 'mt-4 w-full'}>
      {items.map((item) => (
        <View key={item.tag.id} className="mb-2 flex-row items-center justify-between">
          <View className="mr-2 flex-1 flex-row items-center">
            <View
              className="mr-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {formatTagName(item.tag.name)}
            </Text>
          </View>
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {formatDurationLong(item.durationMs)}
          </Text>
        </View>
      ))}
    </View>
  );
}
