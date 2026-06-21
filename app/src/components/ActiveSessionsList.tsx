import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { ActiveSession } from '@/types';
import { formatDuration, formatTagName } from '@/utils/formatDuration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  geofenceNames: Map<string, string>;
  onStop: (sessionId: string) => void;
}

function toggleExpanded(setExpandedId: (value: string | null | ((current: string | null) => string | null)) => void, id: string) {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedId((current) => (current === id ? null : id));
}

export function ActiveSessionsList({ sessions, geofenceNames, onStop }: ActiveSessionsListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStop = (sessionId: string) => {
    onStop(sessionId);
    setExpandedId((current) => (current === sessionId ? null : current));
  };

  return (
    <ThemedSurface className="mb-4 overflow-hidden">
      {sessions.map((session, index) => {
        const elapsed = Date.now() - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames.get(session.geofenceId) : null;
        const tagLabel = session.tags.map((tag) => formatTagName(tag.name)).join(', ');
        const subtitle =
          session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;
        const expanded = expandedId === session.id;

        return (
          <View
            key={session.id}
            style={
              index < sessions.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <Pressable
              onPress={() => toggleExpanded(setExpandedId, session.id)}
              className="flex-row items-center gap-2 px-3 py-2.5"
            >
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: session.tags[0]?.color ?? colors.primary }}
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
                {!expanded && subtitle ? (
                  <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {!expanded ? (
                <>
                  <Text
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: colors.textOnBg }}
                  >
                    {formatDuration(elapsed)}
                  </Text>
                  <Pressable
                    onPress={() => handleStop(session.id)}
                    className="rounded-lg px-2.5 py-1"
                    style={{
                      backgroundColor: colors.destructiveBg,
                      borderColor: colors.destructiveBorder,
                      borderWidth: 1,
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: colors.destructiveText }}>
                      Stop
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </Pressable>

            {expanded ? (
              <View className="px-3 pb-3">
                <View className="mb-3 flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row flex-wrap">
                      {session.tags.map((tag) => (
                        <Text
                          key={tag.id}
                          className="mr-2 text-base font-semibold"
                          style={{ color: tag.color }}
                        >
                          {formatTagName(tag.name)}
                        </Text>
                      ))}
                    </View>
                    {session.source === 'geofence' && geofenceName ? (
                      <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                        at {geofenceName}
                      </Text>
                    ) : null}
                    <Text
                      className="mt-1 text-xs uppercase tracking-wide"
                      style={{ color: colors.textMuted }}
                    >
                      {session.source === 'geofence' ? 'Location tracking' : session.source}
                    </Text>
                  </View>
                  <Text className="font-mono text-2xl font-bold" style={{ color: colors.textOnBg }}>
                    {formatDuration(elapsed)}
                  </Text>
                </View>
                <ActionButton
                  label="Stop"
                  onPress={() => handleStop(session.id)}
                  variant="destructiveOutline"
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
