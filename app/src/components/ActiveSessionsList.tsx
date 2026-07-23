import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StopSessionButton } from '@/components/SessionControlButtons';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { ActiveSession } from '@/types';
import { formatDuration, formatTagName } from '@/utils/formatDuration';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  geofenceNames: Map<string, string>;
  tick?: number;
  onStop: (sessionId: string) => void;
  onExtendAlarm?: (sessionId: string, extraMs: number) => void;
}

function formatAlarmSubtitle(alarmAt: number, now: number): string {
  if (alarmAt <= now) {
    return `Alarm overdue · since ${format(alarmAt, 'h:mm a')}`;
  }
  const remaining = alarmAt - now;
  return `Alarm in ${formatDuration(remaining)} · ${format(alarmAt, 'h:mm a')}`;
}

export function ActiveSessionsList({
  sessions,
  geofenceNames,
  tick = 0,
  onStop,
  onExtendAlarm,
}: ActiveSessionsListProps) {
  const colors = useAppColors();
  void tick;
  const now = Date.now();

  return (
    <ThemedSurface className="mb-4 overflow-hidden">
      {sessions.map((session, index) => {
        const elapsed = now - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames.get(session.geofenceId) : null;
        const tagLabel = session.tags.map((tag) => formatTagName(tag.name)).join(', ');
        const placeSubtitle =
          session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;
        const alarmSubtitle =
          session.alarmAt != null ? formatAlarmSubtitle(session.alarmAt, now) : null;
        const overdue = session.alarmAt != null && session.alarmAt <= now;

        return (
          <View
            key={session.id}
            style={
              index < sessions.length - 1
                ? {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.separator,
                  }
                : undefined
            }
          >
            <View className="flex-row items-center gap-2 px-3 py-2.5">
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
                {placeSubtitle ? (
                  <Text
                    className="ml-3.5 text-sm"
                    style={{ color: colors.textMuted }}
                    numberOfLines={1}
                  >
                    {placeSubtitle}
                  </Text>
                ) : null}
                {alarmSubtitle ? (
                  <Text
                    className="ml-3.5 text-sm"
                    style={{ color: overdue ? colors.destructive : colors.textMuted }}
                    numberOfLines={1}
                  >
                    {alarmSubtitle}
                  </Text>
                ) : null}
              </View>
              <Text
                className="shrink-0 font-mono text-base font-semibold tabular-nums"
                style={{ color: colors.textOnBg }}
              >
                {formatDuration(elapsed)}
              </Text>
              <StopSessionButton
                onPress={() => onStop(session.id)}
                accessibilityLabel={session.alarmAt != null ? 'Finish session' : 'Stop session'}
              />
            </View>

            {session.alarmAt != null && onExtendAlarm ? (
              <View className="flex-row gap-2 px-3 pb-3 pl-8">
                <Pressable
                  onPress={() => onExtendAlarm(session.id, 15 * 60_000)}
                  className="flex-row items-center gap-1 rounded-full border px-3 py-1.5 active:opacity-80"
                  style={{ borderColor: colors.glassBorder, backgroundColor: colors.glass }}
                >
                  <Ionicons name="alarm-outline" size={14} color={colors.text} />
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    +15 min
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onExtendAlarm(session.id, 30 * 60_000)}
                  className="flex-row items-center gap-1 rounded-full border px-3 py-1.5 active:opacity-80"
                  style={{ borderColor: colors.glassBorder, backgroundColor: colors.glass }}
                >
                  <Ionicons name="alarm-outline" size={14} color={colors.text} />
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    +30 min
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
