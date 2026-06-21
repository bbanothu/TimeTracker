import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Switch, Text, UIManager, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GeofencesListProps {
  geofences: Geofence[];
  emptyMessage?: string;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
}

function toggleExpanded(setExpandedId: (value: string | null | ((current: string | null) => string | null)) => void, id: string) {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedId((current) => (current === id ? null : id));
}

export function GeofencesList({
  geofences,
  emptyMessage = 'No saved places yet.',
  onToggle,
  onDelete,
}: GeofencesListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (geofences.length === 0) {
    return (
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {geofences.map((geofence, index) => {
        const expanded = expandedId === geofence.id;
        const tagLabel = formatTagName(geofence.tag?.name ?? 'tag');
        const subtitle = `${tagLabel} · ${geofence.radiusMeters}m`;

        return (
          <View
            key={geofence.id}
            style={
              index < geofences.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
          >
            <View className="flex-row items-center px-3 py-2.5">
              <Pressable
                onPress={() => toggleExpanded(setExpandedId, geofence.id)}
                className="min-w-0 flex-1 flex-row items-center gap-2"
              >
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: geofence.enabled
                          ? geofence.tag?.color ?? colors.primary
                          : colors.textMuted,
                      }}
                    />
                    <Text
                      className="flex-1 text-sm font-semibold"
                      style={{ color: colors.textOnBg }}
                      numberOfLines={1}
                    >
                      {geofence.name}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {expanded ? '▴' : '▾'}
                    </Text>
                  </View>
                  {!expanded ? (
                    <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
              <Switch
                value={geofence.enabled}
                onValueChange={(value) => onToggle(geofence, value)}
                trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              />
            </View>

            {expanded ? (
              <View className="px-3 pb-3">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {geofence.name}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                  {subtitle}
                </Text>
                <Text className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                  {geofence.enabled ? 'Auto-tracking on' : 'Auto-tracking off'}
                </Text>
                <ActionButton
                  label="Delete"
                  onPress={() => onDelete(geofence)}
                  variant="destructiveOutline"
                  className="mt-3"
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
