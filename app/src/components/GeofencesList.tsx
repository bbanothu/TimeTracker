import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';

interface GeofencesListProps {
  geofences: Geofence[];
  emptyMessage?: string;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
}

export function GeofencesList({
  geofences,
  emptyMessage = 'No saved places yet.',
  onToggle,
  onDelete,
}: GeofencesListProps) {
  const colors = useAppColors();

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
        const tagLabel = formatTagName(geofence.tag?.name ?? 'tag');
        const subtitle = `${tagLabel} · ${geofence.radiusMeters}m`;

        return (
          <View
            key={geofence.id}
            className="flex-row items-center gap-2 px-3 py-2.5"
            style={
              index < geofences.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                : undefined
            }
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
                  style={{ color: colors.textOnBg, opacity: geofence.enabled ? 1 : 0.55 }}
                  numberOfLines={1}
                >
                  {geofence.name}
                </Text>
              </View>
              <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Switch
              value={geofence.enabled}
              onValueChange={(value) => onToggle(geofence, value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              accessibilityLabel={`Auto-tracking for ${geofence.name}`}
            />
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete place',
                  `Remove ${geofence.name}? This cannot be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(geofence),
                    },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${geofence.name}`}
              hitSlop={8}
              className="shrink-0 p-1"
            >
              <Ionicons name="trash-outline" size={18} color={colors.destructiveText} />
            </Pressable>
          </View>
        );
      })}
    </ThemedSurface>
  );
}
