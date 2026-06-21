import { useMemo, useState } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
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
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const colors = useAppColors();

  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-2 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
      style={{
        backgroundColor: active ? colors.selectedBg : colors.secondaryBg,
        borderColor: active ? colors.primary : colors.surfaceBorder,
        color: active ? colors.selectedText : colors.textSecondary,
      }}
    >
      {label}
    </button>
  );
}

export function HistoryFilters({ tags, geofences, filters, onChange }: HistoryFiltersProps) {
  const colors = useAppColors();
  const [picker, setPicker] = useState<PickerKind>(null);
  const flatTags = useMemo(() => flattenTags(tags), [tags]);

  const selectedTag = tags.find((tag) => tag.id === filters.tagId) ?? null;
  const selectedGeofence = geofences.find((geofence) => geofence.id === filters.geofenceId) ?? null;

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>
            Filters
          </p>
          {hasActiveHistoryFilters(filters) ? (
            <button
              type="button"
              onClick={() => onChange(defaultHistoryFilters)}
              className="text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
          Date
        </p>
        <div className="mb-3 flex overflow-x-auto pb-1">
          {DATE_PRESETS.map((preset) => (
            <FilterChip
              key={preset}
              label={getHistoryDatePresetLabel(preset)}
              active={filters.datePreset === preset}
              onClick={() => onChange({ ...filters, datePreset: preset })}
            />
          ))}
        </div>

        <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
          Source
        </p>
        <div className="mb-3 flex overflow-x-auto pb-1">
          {SOURCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filters.source === option.value}
              onClick={() => onChange({ ...filters, source: option.value })}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
              Tag
            </p>
            <button
              type="button"
              onClick={() => setPicker('tag')}
              className="flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm"
              style={{ backgroundColor: colors.inputBgSolid, borderColor: colors.inputBorder, color: colors.text }}
            >
              <span className="truncate">{selectedTag ? formatTagName(selectedTag.name) : 'All tags'}</span>
              <span className="shrink-0" style={{ color: colors.textMuted }}>
                ▾
              </span>
            </button>
          </div>

          {geofences.length > 0 ? (
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
                Place
              </p>
              <button
                type="button"
                onClick={() => setPicker('place')}
                className="flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm"
                style={{ backgroundColor: colors.inputBgSolid, borderColor: colors.inputBorder, color: colors.text }}
              >
                <span className="truncate">{selectedGeofence ? selectedGeofence.name : 'All places'}</span>
                <span className="shrink-0" style={{ color: colors.textMuted }}>
                  ▾
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </ThemedSurface>

      {picker ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ backgroundColor: colors.overlay }}
        >
          <ThemedSurface
            className="max-h-[70vh] w-full max-w-md overflow-hidden p-4"
            style={{ backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                {picker === 'tag' ? 'Filter by tag' : 'Filter by place'}
              </h3>
              <button type="button" onClick={() => setPicker(null)} style={{ color: colors.textMuted }}>
                ✕
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {picker === 'tag' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...filters, tagId: null });
                      setPicker(null);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left"
                    style={{
                      backgroundColor: filters.tagId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
                      color: colors.text,
                    }}
                  >
                    All tags
                  </button>
                  {flatTags.map((item) => (
                    <button
                      key={item.tag.id}
                      type="button"
                      onClick={() => {
                        onChange({ ...filters, tagId: item.tag.id });
                        setPicker(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left"
                      style={{
                        marginLeft: item.depth * 12,
                        backgroundColor:
                          filters.tagId === item.tag.id ? colors.selectedBgSolid : colors.secondaryBgSolid,
                        color: colors.text,
                      }}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.tag.color }} />
                      {formatTagName(item.path)}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...filters, geofenceId: null });
                      setPicker(null);
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left"
                    style={{
                      backgroundColor: filters.geofenceId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
                      color: colors.text,
                    }}
                  >
                    All places
                  </button>
                  {geofences.map((geofence) => (
                    <button
                      key={geofence.id}
                      type="button"
                      onClick={() => {
                        onChange({ ...filters, geofenceId: geofence.id });
                        setPicker(null);
                      }}
                      className="w-full rounded-xl px-4 py-3 text-left"
                      style={{
                        backgroundColor:
                          filters.geofenceId === geofence.id ? colors.selectedBgSolid : colors.secondaryBgSolid,
                        color: colors.text,
                      }}
                    >
                      {geofence.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          </ThemedSurface>
        </div>
      ) : null}
    </>
  );
}
