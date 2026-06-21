import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (geofences.length === 0) {
    return (
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {geofences.map((geofence, index) => {
        const expanded = expandedId === geofence.id;
        const tagLabel = formatTagName(geofence.tag?.name ?? 'tag');
        const subtitle = `${tagLabel} · ${geofence.radiusMeters}m`;

        return (
          <div
            key={geofence.id}
            style={
              index < geofences.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === geofence.id ? null : geofence.id))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: geofence.enabled
                          ? geofence.tag?.color ?? colors.chartPrimary
                          : colors.textMuted,
                      }}
                    />
                    <span
                      className="truncate text-sm font-semibold"
                      style={{ color: colors.textOnBg }}
                    >
                      {geofence.name}
                    </span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {expanded ? '▴' : '▾'}
                    </span>
                  </div>
                  {!expanded ? (
                    <p className="ml-3.5 truncate text-xs" style={{ color: colors.textMuted }}>
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </button>
              <label className="flex shrink-0 items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                <input
                  type="checkbox"
                  checked={geofence.enabled}
                  onChange={(event) => onToggle(geofence, event.target.checked)}
                />
                On
              </label>
            </div>

            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out"
              style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3">
                  <p className="text-base font-semibold" style={{ color: colors.text }}>
                    {geofence.name}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                    {subtitle}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                    {geofence.enabled ? 'Auto-tracking on' : 'Auto-tracking off'}
                  </p>
                  <ActionButton
                    label="Delete"
                    variant="destructiveOutline"
                    className="mt-3"
                    onClick={() => onDelete(geofence)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
