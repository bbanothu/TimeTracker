import { Alert, Pressable, Switch, Text, View } from 'react-native';
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
      <ThemedSurface className="px-4 py-5">
        <Text className="text-center text-[15px]" style={{ color: colors.textMuted }}>
          {emptyMessage}
        </Text>
      </ThemedSurface>
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
            className="flex-row items-center gap-2.5 py-3 pr-3"
            style={{
              paddingLeft: 14 + indent,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.separator,
            }}
          >
            <View
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <Text
              className="min-w-0 flex-1 text-[15px] font-medium"
              style={{ color: included ? colors.textOnBg : colors.textMuted }}
              numberOfLines={1}
              accessibilityLabel={pathLabel}
            >
              {label}
            </Text>
            <Switch
              value={included}
              onValueChange={(value) => onToggleAnalytics(item.tag, value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.switchTrackOff}
              accessibilityLabel="Include in analytics"
            />
            <Pressable
              onPress={() => onEdit(item.tag)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${label}`}
              hitSlop={8}
              className="shrink-0 p-1.5"
            >
              <Ionicons name="create-outline" size={20} color={colors.textMuted} />
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
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            </Pressable>
          </View>
        );
      })}
    </ThemedSurface>
  );
}
