import { Pressable, Text, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { ActiveSession } from '@/types';
import { formatDuration, formatTagName } from '@/utils/formatDuration';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  geofenceNames: Map<string, string>;
  onStop: (sessionId: string) => void;
}

export function ActiveSessionsList({ sessions, geofenceNames, onStop }: ActiveSessionsListProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden">
      {sessions.map((session, index) => {
        const elapsed = Date.now() - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames.get(session.geofenceId) : null;
        const tagLabel = session.tags.map((tag) => formatTagName(tag.name)).join(', ');
        const subtitle = session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;

        return (
          <View
            key={session.id}
            className="flex-row items-center gap-2 px-3 py-2.5"
            style={
              index < sessions.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: session.tags[0]?.color ?? colors.primary }}
                />
                <Text
                  className="flex-1 text-base font-semibold"
                  style={{ color: colors.textOnBg }}
                  numberOfLines={1}
                >
                  {tagLabel}
                </Text>
              </View>
              {subtitle ? (
                <Text
                  className="ml-3.5 text-sm"
                  style={{ color: colors.textMuted }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Text
              className="shrink-0 font-mono text-base font-semibold tabular-nums"
              style={{ color: colors.textOnBg }}
            >
              {formatDuration(elapsed)}
            </Text>
            <Pressable
              onPress={() => onStop(session.id)}
              accessibilityRole="button"
              accessibilityLabel="Stop session"
              className="items-center justify-center rounded-full active:opacity-80"
              style={{
                width: 28,
                height: 28,
                borderWidth: 2.5,
                borderColor: colors.stop,
                backgroundColor: 'transparent',
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2.5,
                  backgroundColor: colors.stop,
                }}
              />
            </Pressable>
          </View>
        );
      })}
    </ThemedSurface>
  );
}
