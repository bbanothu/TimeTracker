import { View } from 'react-native';

import { TagChip } from '@/components/TagChip';
import type { Tag } from '@/types';

interface TagPickerProps {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  disabled?: boolean;
}

export function TagPicker({ tags, selectedIds, onToggle, disabled }: TagPickerProps) {
  return (
    <View className="flex-row flex-wrap">
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          selected={selectedIds.includes(tag.id)}
          onPress={() => onToggle(tag.id)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}
