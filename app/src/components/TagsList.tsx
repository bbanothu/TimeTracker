import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import type { FlatTagItem } from '@/utils/tagTree';

interface TagsListProps {
  items: FlatTagItem[];
  emptyMessage?: string;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onToggleAnalytics: (tag: Tag, includeInAnalytics: boolean) => void;
}

export function TagsList({
  items,
  emptyMessage = 'No tags yet.',
  onEdit,
  onDelete,
  onToggleAnalytics,
}: TagsListProps) {
  const colors = useAppColors();

  if (items.length === 0) {
    return (
      <Text className="py-2 text-center text-base" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {items.map((item, index) => {
        const indent = item.depth * 14;
        const included = item.tag.includeInAnalytics !== false;
        const label = formatTagName(item.tag.name);
        const pathLabel = item.depth > 0 ? formatTagName(item.path) : label;

        return (
          <View
            key={item.tag.id}
            className="flex-row items-center gap-2.5 py-3.5 pr-3"
            style={{
              paddingLeft: 14 + indent,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.surfaceBorder,
            }}
          >
            <View
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <Text
              className="min-w-0 flex-1 text-base font-semibold"
              style={{ color: included ? colors.textOnBg : colors.textMuted }}
              numberOfLines={1}
              accessibilityLabel={pathLabel}
            >
              {label}
            </Text>
            <Pressable
              onPress={() => onToggleAnalytics(item.tag, !included)}
              accessibilityRole="switch"
              accessibilityState={{ checked: included }}
              accessibilityLabel="Include in analytics"
              hitSlop={8}
              className="h-6 w-11 shrink-0 justify-center rounded-full border"
              style={{
                backgroundColor: included ? colors.primary : colors.secondaryBg,
                borderColor: included ? colors.primary : colors.surfaceBorder,
              }}
            >
              <View
                className="h-4 w-4 rounded-full bg-white"
                style={{ marginLeft: included ? 26 : 2 }}
              />
            </Pressable>
            <Pressable
              onPress={() => onEdit(item.tag)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${label}`}
              hitSlop={8}
              className="shrink-0 p-1.5"
            >
              <Ionicons name="create-outline" size={22} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert('Delete tag', `Remove ${label}? This cannot be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(item.tag),
                  },
                ]);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${label}`}
              hitSlop={8}
              className="shrink-0 p-1.5"
            >
              <Ionicons name="trash-outline" size={22} color={colors.destructiveText} />
            </Pressable>
          </View>
        );
      })}
    </ThemedSurface>
  );
}
