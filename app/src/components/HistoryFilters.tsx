import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/BottomSheetModal';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { Geofence, Tag } from '@/types';
import {
  defaultHistoryFilters,
  getHistoryDatePresetLabel,
  hasActiveHistoryFilters,
  type HistoryDatePreset,
  type HistoryFilterState,
} from '@/utils/historyFilters';
import { flattenTags } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';

interface HistoryFiltersProps {
  tags: Tag[];
  geofences: Geofence[];
  filters: HistoryFilterState;
  onChange: (filters: HistoryFilterState) => void;
}

type PickerKind = 'tag' | 'place' | null;

const DATE_PRESETS: HistoryDatePreset[] = ['all', 'today', 'week', 'month'];
const SOURCE_OPTIONS: Array<{ value: HistoryFilterState['source']; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'manual', label: 'Manual' },
  { value: 'geofence', label: 'Geofence' },
];

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      className="mr-2 rounded-full border px-3 py-1.5"
      style={{
        backgroundColor: active ? colors.selectedBg : colors.secondaryBg,
        borderColor: active ? colors.primary : colors.surfaceBorder,
      }}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: active ? colors.selectedText : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function HistoryFilters({ tags, geofences, filters, onChange }: HistoryFiltersProps) {
  const colors = useAppColors();
  const [picker, setPicker] = useState<PickerKind>(null);
  const flatTags = useMemo(() => flattenTags(tags), [tags]);

  const selectedTag = tags.find((tag) => tag.id === filters.tagId) ?? null;
  const selectedGeofence = geofences.find((geofence) => geofence.id === filters.geofenceId) ?? null;

  const tagLabel = selectedTag ? formatTagName(selectedTag.name) : 'All tags';
  const placeLabel = selectedGeofence ? selectedGeofence.name : 'All places';

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>
            Filters
          </Text>
          {hasActiveHistoryFilters(filters) ? (
            <Pressable onPress={() => onChange(defaultHistoryFilters)}>
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Clear all
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
          Date
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {DATE_PRESETS.map((preset) => (
            <FilterChip
              key={preset}
              label={getHistoryDatePresetLabel(preset)}
              active={filters.datePreset === preset}
              onPress={() => onChange({ ...filters, datePreset: preset })}
            />
          ))}
        </ScrollView>

        <Text className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
          Source
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {SOURCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filters.source === option.value}
              onPress={() => onChange({ ...filters, source: option.value })}
            />
          ))}
        </ScrollView>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
              Tag
            </Text>
            <Pressable
              onPress={() => setPicker('tag')}
              className="flex-row items-center justify-between rounded-xl border px-3 py-2.5"
              style={{ backgroundColor: colors.inputBgSolid, borderColor: colors.inputBorder }}
            >
              <Text className="flex-1 text-sm" style={{ color: colors.text }} numberOfLines={1}>
                {tagLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {geofences.length > 0 ? (
            <View className="flex-1">
              <Text className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
                Place
              </Text>
              <Pressable
                onPress={() => setPicker('place')}
                className="flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ backgroundColor: colors.inputBgSolid, borderColor: colors.inputBorder }}
              >
                <Text className="flex-1 text-sm" style={{ color: colors.text }} numberOfLines={1}>
                  {placeLabel}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </ThemedSurface>

      <BottomSheetModal
        visible={picker === 'tag'}
        title="Filter by tag"
        onClose={() => setPicker(null)}
      >
        <ScrollView className="max-h-80">
          <Pressable
            onPress={() => {
              onChange({ ...filters, tagId: null });
              setPicker(null);
            }}
            className="mb-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: filters.tagId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
            }}
          >
            <Text className="text-base" style={{ color: colors.text }}>
              All tags
            </Text>
          </Pressable>
          {flatTags.map((item) => {
            const selected = filters.tagId === item.tag.id;
            return (
              <Pressable
                key={item.tag.id}
                onPress={() => {
                  onChange({ ...filters, tagId: item.tag.id });
                  setPicker(null);
                }}
                className="mb-2 flex-row items-center rounded-xl px-4 py-3"
                style={{
                  marginLeft: item.depth * 12,
                  backgroundColor: selected ? colors.selectedBgSolid : colors.secondaryBgSolid,
                }}
              >
                <View
                  className="mr-3 h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.tag.color }}
                />
                <Text className="text-base" style={{ color: colors.text }}>
                  {formatTagName(item.path)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheetModal>

      <BottomSheetModal
        visible={picker === 'place'}
        title="Filter by place"
        onClose={() => setPicker(null)}
        sheetClassName="max-h-[50%]"
      >
        <ScrollView className="max-h-72">
          <Pressable
            onPress={() => {
              onChange({ ...filters, geofenceId: null });
              setPicker(null);
            }}
            className="mb-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: filters.geofenceId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
            }}
          >
            <Text className="text-base" style={{ color: colors.text }}>
              All places
            </Text>
          </Pressable>
          {geofences.map((geofence) => {
            const selected = filters.geofenceId === geofence.id;
            return (
              <Pressable
                key={geofence.id}
                onPress={() => {
                  onChange({ ...filters, geofenceId: geofence.id });
                  setPicker(null);
                }}
                className="mb-2 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: selected ? colors.selectedBgSolid : colors.secondaryBgSolid,
                }}
              >
                <Text className="text-base" style={{ color: colors.text }}>
                  {geofence.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheetModal>
    </>
  );
}
