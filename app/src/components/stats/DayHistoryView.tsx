import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ExpandableDetails, ExpandChevron } from '@/components/ExpandableDetails';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface DayHistoryViewProps {
  entries: TimeEntry[];
  geofenceNames?: Map<string, string>;
  emptyMessage?: string;
}

function formatTimeRange(startedAt: number, endedAt: number): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const startTime = new Date(startedAt).toLocaleTimeString([], timeOptions);
  const endTime = new Date(endedAt).toLocaleTimeString([], timeOptions);
  return `${startTime} – ${endTime}`;
}

export function DayHistoryView({
  entries,
  geofenceNames,
  emptyMessage = 'No sessions recorded this day.',
}: DayHistoryViewProps) {
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

  if (entries.length === 0) {
    return (
      <ThemedSurface className="p-4">
        <Text className="text-center text-sm" style={{ color: colors.textMuted }}>
          {emptyMessage}
        </Text>
      </ThemedSurface>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {entries.map((entry, index) => {
        if (entry.endedAt == null) return null;

        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt);
        const subtitle =
          entry.source === 'geofence' && geofenceName
            ? `${timeRange} · @ ${geofenceName}`
            : timeRange;
        const details = entry.details?.trim() ?? '';
        const hasDetails = details.length > 0;
        const expanded = expandedIds.has(entry.id);

        const rowContent = (
          <>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.tags[0]?.color ?? colors.primary }}
                />
                <Text
                  className="shrink text-sm font-semibold"
                  style={{ color: colors.textOnBg }}
                  numberOfLines={1}
                >
                  {tagLabel}
                </Text>
              </View>
              <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                {subtitle}
              </Text>
            </View>
            <Text className="shrink-0 text-sm font-medium" style={{ color: colors.textSecondary }}>
              {formatDurationLong(duration)}
            </Text>
            {hasDetails ? <ExpandChevron expanded={expanded} color={colors.textMuted} /> : null}
          </>
        );

        return (
          <View
            key={entry.id}
            style={
              index < entries.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            {hasDetails ? (
              <Pressable
                onPress={() => toggleExpanded(entry.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                className="flex-row items-center gap-2 px-3 py-2.5 active:opacity-80"
              >
                {rowContent}
              </Pressable>
            ) : (
              <View className="flex-row items-center gap-2 px-3 py-2.5">{rowContent}</View>
            )}
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
        );
      })}
    </ThemedSurface>
  );
}
