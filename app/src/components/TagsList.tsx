import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { TagChip } from '@/components/TagChip';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import type { FlatTagItem } from '@/utils/tagTree';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TagsListProps {
  items: FlatTagItem[];
  emptyMessage?: string;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

function toggleExpanded(setExpandedId: (value: string | null | ((current: string | null) => string | null)) => void, id: string) {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedId((current) => (current === id ? null : id));
}

export function TagsList({
  items,
  emptyMessage = 'No tags yet.',
  onEdit,
  onDelete,
}: TagsListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {items.map((item, index) => {
        const expanded = expandedId === item.tag.id;
        const indent = item.depth * 12;

        return (
          <View
            key={item.tag.id}
            style={
              index < items.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <Pressable
              onPress={() => toggleExpanded(setExpandedId, item.tag.id)}
              className="flex-row items-center gap-2 py-2.5 pr-3"
              style={{ paddingLeft: 12 + indent }}
            >
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.tag.color }}
                  />
                  <Text
                    className="flex-1 text-sm font-semibold"
                    style={{ color: item.tag.color }}
                    numberOfLines={1}
                  >
                    {formatTagName(item.tag.name)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {expanded ? '▴' : '▾'}
                  </Text>
                </View>
                {!expanded && item.depth > 0 ? (
                  <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                    {item.path}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            {expanded ? (
              <View className="px-3 pb-3" style={{ paddingLeft: 12 + indent }}>
                <View className="mb-3">
                  <TagChip tag={item.tag} />
                  {item.depth > 0 ? (
                    <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                      {item.path}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row items-center gap-2">
                    <View
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: item.tag.color, borderColor: colors.surfaceBorder }}
                    />
                    <Text className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
                      {item.depth === 0 ? 'Top level' : 'Nested tag'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <ActionButton label="Edit" onPress={() => onEdit(item.tag)} variant="secondary" className="flex-1" />
                  <ActionButton
                    label="Delete"
                    onPress={() => onDelete(item.tag)}
                    variant="destructiveOutline"
                    className="flex-1"
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
