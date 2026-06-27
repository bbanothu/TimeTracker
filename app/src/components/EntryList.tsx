import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
  geofenceNames?: Map<string, string>;
  showDate?: boolean;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
}

function formatTimeRange(startedAt: number, endedAt: number, showDate: boolean): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const startTime = start.toLocaleTimeString([], timeOptions);
  const endTime = end.toLocaleTimeString([], timeOptions);

  if (!showDate) {
    return `${startTime} – ${endTime}`;
  }

  const sameDay = start.toDateString() === end.toDateString();
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startDate = start.toLocaleDateString([], dateOptions);

  if (sameDay) {
    return `${startDate}, ${startTime} – ${endTime}`;
  }

  const endDate = end.toLocaleDateString([], dateOptions);
  return `${startDate} ${startTime} – ${endDate} ${endTime}`;
}

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  geofenceNames,
  showDate = false,
  onEdit,
  onDelete,
}: EntryListProps) {
  const colors = useAppColors();

  if (entries.length === 0) {
    return (
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {entries.map((entry, index) => {
        if (entry.endedAt == null) return null;

        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt, showDate);
        const subtitle =
          entry.source === 'geofence' && geofenceName ? `${timeRange} · @ ${geofenceName}` : timeRange;

        return (
          <View
            key={entry.id}
            className="flex-row items-center gap-2 px-3 py-2.5"
            style={
              index < entries.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.tags[0]?.color ?? colors.primary }}
                />
                <Text
                  className="flex-1 text-sm font-semibold"
                  style={{ color: colors.textOnBg }}
                  numberOfLines={1}
                >
                  {tagLabel}
                </Text>
              </View>
              <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Text className="shrink-0 text-sm font-medium tabular-nums" style={{ color: colors.textSecondary }}>
              {formatDurationLong(duration)}
            </Text>
            {onEdit ? (
              <Pressable
                onPress={() => onEdit(entry)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${tagLabel}`}
                hitSlop={8}
                className="shrink-0 p-1"
              >
                <Ionicons name="create-outline" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={() => {
                  Alert.alert('Delete entry', 'Remove this tracked session permanently? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(entry.id),
                    },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${tagLabel}`}
                hitSlop={8}
                className="shrink-0 p-1"
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructiveText} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
