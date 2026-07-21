import { useMemo, useState } from 'react';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { confirmDelete } from '@/lib/confirm';
import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import { groupGeofencesByTag, tagGroupSubtitle } from '@/utils/groupGeofences';
import { chevronDown, createOutline, trashOutline } from 'ionicons/icons';

interface GeofencesListProps {
  geofences: Geofence[];
  emptyMessage?: string;
  onEdit: (geofence: Geofence) => void;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
}

function GeofenceRow({
  geofence,
  colors,
  onEdit,
  onToggle,
  onDelete,
  indented = false,
}: {
  geofence: Geofence;
  colors: ReturnType<typeof useAppColors>;
  onEdit: (geofence: Geofence) => void;
  onToggle: (geofence: Geofence, enabled: boolean) => void;
  onDelete: (geofence: Geofence) => void;
  indented?: boolean;
}) {
  const tagLabel = formatTagName(geofence.tag?.name ?? 'tag');
  const subtitle = indented
    ? `${geofence.radiusMeters}m`
    : `${tagLabel} · ${geofence.radiusMeters}m`;

  return (
    <>
      <div className={`min-w-0 flex-1 ${indented ? 'pl-5' : ''}`}>
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: geofence.enabled
                ? (geofence.tag?.color ?? colors.chartPrimary)
                : colors.textMuted,
            }}
          />
          <span
            className="truncate text-sm font-semibold"
            style={{ color: geofence.enabled ? colors.textOnBg : colors.textMuted }}
            title={geofence.name}
          >
            {geofence.name}
          </span>
        </div>
        <p className="ml-3.5 truncate text-xs" style={{ color: colors.textMuted }}>
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={geofence.enabled}
        aria-label={`Auto-tracking for ${geofence.name}`}
        title={geofence.enabled ? 'Auto-tracking on' : 'Auto-tracking off'}
        onClick={() => onToggle(geofence, !geofence.enabled)}
        className="relative h-5 w-9 shrink-0 overflow-hidden rounded-full border transition"
        style={{
          backgroundColor: geofence.enabled ? colors.primary : colors.secondaryBg,
          borderColor: geofence.enabled ? colors.primary : colors.surfaceBorder,
        }}
      >
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-all"
          style={{ left: geofence.enabled ? 'calc(100% - 0.875rem - 2px)' : '2px' }}
        />
      </button>
      <button
        type="button"
        aria-label={`Edit ${geofence.name}`}
        title="Edit"
        onClick={() => onEdit(geofence)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition hover:opacity-80"
      >
        <AppIcon icon={createOutline} size={20} color={colors.textMuted} />
      </button>
      <button
        type="button"
        aria-label={`Delete ${geofence.name}`}
        title="Delete"
        onClick={() => {
          if (!confirmDelete(`Remove ${geofence.name}? This cannot be undone.`)) return;
          onDelete(geofence);
        }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition hover:opacity-80"
      >
        <AppIcon icon={trashOutline} size={20} color={colors.destructiveText} />
      </button>
    </>
  );
}

export function GeofencesList({
  geofences,
  emptyMessage = 'No saved places yet.',
  onEdit,
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
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {groups.map((group, groupIndex) => {
        const isMultiPlace = group.geofences.length > 1;
        const expanded = expandedKeys.has(group.key);
        const anyEnabled = group.geofences.some((geofence) => geofence.enabled);
        const borderStyle =
          groupIndex < groups.length - 1
            ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
            : undefined;

        if (!isMultiPlace) {
          const geofence = group.geofences[0];
          return (
            <div
              key={group.key}
              className="flex items-center gap-2 px-3 py-2.5"
              style={borderStyle}
            >
              <GeofenceRow
                geofence={geofence}
                colors={colors}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            </div>
          );
        }

        return (
          <div key={group.key} style={borderStyle}>
            <button
              type="button"
              onClick={() => toggleExpanded(group.key)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:opacity-90"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: anyEnabled ? group.tagColor : colors.textMuted,
                    }}
                  />
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: anyEnabled ? colors.textOnBg : colors.textMuted }}
                  >
                    {group.tagLabel}
                  </span>
                </div>
                <p className="ml-3.5 truncate text-xs" style={{ color: colors.textMuted }}>
                  {tagGroupSubtitle(group.geofences)}
                </p>
              </div>
              <AppIcon
                icon={chevronDown}
                size={16}
                color={colors.textMuted}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>

            {expanded
              ? group.geofences.map((geofence, index) => (
                  <div
                    key={geofence.id}
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={
                      index < group.geofences.length - 1
                        ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                        : undefined
                    }
                  >
                    <GeofenceRow
                      geofence={geofence}
                      colors={colors}
                      onEdit={onEdit}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      indented
                    />
                  </div>
                ))
              : null}
          </div>
        );
      })}
    </ThemedSurface>
  );
}
