import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { TimeEntry } from '@/types';
import { formatDuration, formatDurationLong, formatTagName } from '@/utils/formatDuration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
  geofenceNames?: Map<string, string>;
}

function formatTimeRange(startedAt: number, endedAt: number): string {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startedAt).toLocaleTimeString([], options)} – ${new Date(endedAt).toLocaleTimeString([], options)}`;
}

function toggleExpanded(setExpandedId: (value: string | null | ((current: string | null) => string | null)) => void, id: string) {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedId((current) => (current === id ? null : id));
}

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  geofenceNames,
}: EntryListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt);
        const expanded = expandedId === entry.id;

        return (
          <View
            key={entry.id}
            style={
              index < entries.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <Pressable
              onPress={() => toggleExpanded(setExpandedId, entry.id)}
              className="flex-row items-center gap-2 px-3 py-2.5"
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
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {expanded ? '▴' : '▾'}
                  </Text>
                </View>
                {!expanded ? (
                  <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                    {timeRange}
                  </Text>
                ) : null}
              </View>

              {!expanded ? (
                <Text className="text-sm font-medium tabular-nums" style={{ color: colors.textSecondary }}>
                  {formatDurationLong(duration)}
                </Text>
              ) : null}
            </Pressable>

            {expanded ? (
              <View className="px-3 pb-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row flex-wrap">
                      {entry.tags.length > 0 ? (
                        entry.tags.map((tag) => (
                          <Text
                            key={tag.id}
                            className="mr-2 text-base font-semibold"
                            style={{ color: tag.color }}
                          >
                            {formatTagName(tag.name)}
                          </Text>
                        ))
                      ) : (
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>
                          Untagged
                        </Text>
                      )}
                    </View>
                    {entry.source === 'geofence' && geofenceName ? (
                      <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                        at {geofenceName}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                      {timeRange}
                    </Text>
                    <View
                      className="mt-2 self-start rounded-full px-2 py-1"
                      style={{ backgroundColor: colors.selectedBg }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.selectedText }}>
                        {entry.source}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-mono text-2xl font-bold" style={{ color: colors.textOnBg }}>
                    {formatDuration(duration)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
