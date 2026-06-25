import { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import { groupGeofencesByTag, tagGroupSubtitle } from '@/utils/groupGeofences';

interface GeofencesListProps {
  geofences: Geofence[];
  emptyMessage?: string;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
}

function GeofenceRow({
  geofence,
  colors,
  onToggle,
  onDelete,
  indented = false,
}: {
  geofence: Geofence;
  colors: ReturnType<typeof useAppColors>;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
  indented?: boolean;
}) {
  const tagLabel = formatTagName(geofence.tag?.name ?? 'tag');
  const subtitle = indented ? `${geofence.radiusMeters}m` : `${tagLabel} · ${geofence.radiusMeters}m`;

  return (
    <>
      <View className={`min-w-0 flex-1 ${indented ? 'pl-5' : ''}`}>
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
            style={{ color: geofence.enabled ? colors.textOnBg : colors.textMuted }}
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
          Alert.alert('Delete place', `Remove ${geofence.name}? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onDelete(geofence),
            },
          ]);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${geofence.name}`}
        hitSlop={8}
        className="shrink-0 p-1"
      >
        <Ionicons name="trash-outline" size={18} color={colors.destructiveText} />
      </Pressable>
    </>
  );
}

export function GeofencesList({
  geofences,
  emptyMessage = 'No saved places yet.',
  onToggle,
  onDelete,
}: GeofencesListProps) {
  const colors = useAppColors();
  const groups = useMemo(() => groupGeofencesByTag(geofences), [geofences]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (key: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (geofences.length === 0) {
    return (
      <Text className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {groups.map((group, groupIndex) => {
        const isMultiPlace = group.geofences.length > 1;
        const expanded = expandedKeys.has(group.key);
        const anyEnabled = group.geofences.some((geofence) => geofence.enabled);
        const borderStyle =
          groupIndex < groups.length - 1
            ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
            : undefined;

        if (!isMultiPlace) {
          const geofence = group.geofences[0];
          return (
            <View key={group.key} className="flex-row items-center gap-2 px-3 py-2.5" style={borderStyle}>
              <GeofenceRow
                geofence={geofence}
                colors={colors}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            </View>
          );
        }

        return (
          <View key={group.key} style={borderStyle}>
            <Pressable
              onPress={() => toggleExpanded(group.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              className="flex-row items-center gap-2 px-3 py-2.5"
            >
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: anyEnabled ? group.tagColor : colors.textMuted,
                    }}
                  />
                  <Text
                    className="flex-1 text-sm font-semibold"
                    style={{ color: anyEnabled ? colors.textOnBg : colors.textMuted }}
                    numberOfLines={1}
                  >
                    {group.tagLabel}
                  </Text>
                </View>
                <Text className="ml-3.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                  {tagGroupSubtitle(group.geofences)}
                </Text>
              </View>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>

            {expanded
              ? group.geofences.map((geofence, index) => (
                  <View
                    key={geofence.id}
                    className="flex-row items-center gap-2 px-3 py-2.5"
                    style={
                      index < group.geofences.length - 1
                        ? { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }
                        : undefined
                    }
                  >
                    <GeofenceRow
                      geofence={geofence}
                      colors={colors}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      indented
                    />
                  </View>
                ))
              : null}
          </View>
        );
      })}
    </ThemedSurface>
  );
}
