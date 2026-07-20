import { Pressable, Text } from 'react-native';

import { formatTagName } from '@/utils/formatDuration';
import type { Tag } from '@/types';

interface TagChipProps {
  tag: Tag;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function TagChip({ tag, selected = false, onPress, disabled }: TagChipProps) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`mr-2 mb-2 rounded-full border px-3 py-2 ${
        selected
          ? 'border-transparent'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
      style={selected ? { backgroundColor: tag.color } : undefined}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {formatTagName(tag.name)}
      </Text>
    </Pressable>
  );
}
