import { Fragment, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ExpandableDetails, ExpandChevron } from '@/components/ExpandableDetails';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { TimeEntry } from '@/types';
import { formatMergePreview, getMergePair } from '@/utils/entryMerge';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
  geofenceNames?: Map<string, string>;
  showDate?: boolean;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  onMerge?: (keepEntryId: string, deleteEntryId: string) => void;
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
  onMerge,
}: EntryListProps) {
  const colors = useAppColors();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (entryId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const completedEntries = useMemo(
    () => entries.filter((entry) => entry.endedAt != null),
    [entries],
  );

  if (completedEntries.length === 0) {
    return (
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  const handleMergePress = (index: number) => {
    const pair = getMergePair(completedEntries, index);
    if (!pair || !onMerge) return;

    Alert.alert(
      'Merge sessions',
      `Merge these into one session?\n${formatMergePreview(pair.older, pair.newer)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => onMerge(pair.older.id, pair.newer.id),
        },
      ],
    );
  };

  return (
    <ThemedSurface className="overflow-hidden">
      {completedEntries.map((entry, index) => {
        const duration = entry.endedAt! - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt!, showDate);
        const subtitle =
          entry.source === 'geofence' && geofenceName
            ? `${timeRange} · @ ${geofenceName}`
            : timeRange;
        const mergePair = onMerge ? getMergePair(completedEntries, index) : null;
        const details = entry.details?.trim() ?? '';
        const hasDetails = details.length > 0;
        const expanded = expandedIds.has(entry.id);
        const showBottomBorder = index < completedEntries.length - 1 || mergePair;

        const mainContent = (
          <>
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
          </>
        );

        return (
          <Fragment key={entry.id}>
            <View
              style={
                showBottomBorder
                  ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                  : undefined
              }
            >
              <View className="flex-row items-center gap-2 px-3 py-2.5">
                {hasDetails ? (
                  <Pressable
                    onPress={() => toggleExpanded(entry.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    className="min-w-0 flex-1 flex-row items-center gap-2 active:opacity-80"
                  >
                    <View className="min-w-0 flex-1">{mainContent}</View>
                    <ExpandChevron expanded={expanded} color={colors.textMuted} />
                    <Text
                      className="shrink-0 text-sm font-medium tabular-nums"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatDurationLong(duration)}
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    <View className="min-w-0 flex-1">{mainContent}</View>
                    <Text
                      className="shrink-0 text-sm font-medium tabular-nums"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatDurationLong(duration)}
                    </Text>
                  </>
                )}
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
                      Alert.alert(
                        'Delete entry',
                        'Remove this tracked session permanently? This cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => onDelete(entry.id),
                          },
                        ],
                      );
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
              {hasDetails ? (
                <ExpandableDetails
                  expanded={expanded}
                  style={{ paddingHorizontal: 12, paddingBottom: 12, paddingLeft: 32 }}
                >
                  <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                    {details}
                  </Text>
                </ExpandableDetails>
              ) : null}
            </View>
            {mergePair ? (
              <Pressable
                onPress={() => handleMergePress(index)}
                accessibilityRole="button"
                accessibilityLabel="Merge with session below"
                className="flex-row items-center justify-center gap-1.5 px-3 py-2"
                style={{
                  borderBottomWidth: index < completedEntries.length - 1 ? 1 : 0,
                  borderBottomColor: colors.surfaceBorder,
                  backgroundColor: colors.secondaryBgSolid,
                }}
              >
                <Ionicons name="git-merge-outline" size={14} color={colors.primary} />
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                  Merge
                </Text>
              </Pressable>
            ) : null}
          </Fragment>
        );
      })}
    </ThemedSurface>
  );
}
