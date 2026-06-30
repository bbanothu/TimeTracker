import { useState } from 'react';

import { ExpandableDetails, ExpandChevron } from '@/components/ui/ExpandableDetails';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface DayHistoryViewProps {
  entries: TimeEntry[];
  geofenceNames?: Map<string, string>;
  emptyMessage?: string;
}

function formatTimeRange(startedAt: number, endedAt: number): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const startTime = new Date(startedAt).toLocaleTimeString([], timeOptions);
  const endTime = new Date(endedAt).toLocaleTimeString([], timeOptions);
  return `${startTime} – ${endTime}`;
}

export function DayHistoryView({
  entries,
  geofenceNames,
  emptyMessage = 'No sessions recorded this day.',
}: DayHistoryViewProps) {
  const colors = useAppColors();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (entryId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <ThemedSurface className="p-4">
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          {emptyMessage}
        </p>
      </ThemedSurface>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {entries.map((entry, index) => {
        if (entry.endedAt == null) return null;

        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt);
        const subtitle =
          entry.source === 'geofence' && geofenceName
            ? `${timeRange} · @ ${geofenceName}`
            : timeRange;
        const details = entry.details?.trim() ?? '';
        const hasDetails = details.length > 0;
        const expanded = expandedIds.has(entry.id);

        const rowContent = (
          <>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.tags[0]?.color ?? colors.primary }}
                />
                <span
                  className="truncate text-sm font-semibold"
                  style={{ color: colors.textOnBg }}
                  title={tagLabel}
                >
                  {tagLabel}
                </span>
              </div>
              <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                {subtitle}
              </p>
            </div>
            <span
              className="shrink-0 text-sm font-medium tabular-nums"
              style={{ color: colors.textSecondary }}
            >
              {formatDurationLong(duration)}
            </span>
            {hasDetails ? <ExpandChevron expanded={expanded} color={colors.textMuted} /> : null}
          </>
        );

        return (
          <div
            key={entry.id}
            style={
              index < entries.length - 1 ? { borderBottom: `1px solid ${colors.surfaceBorder}` } : undefined
            }
          >
            {hasDetails ? (
              <button
                type="button"
                onClick={() => toggleExpanded(entry.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:opacity-90"
              >
                {rowContent}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5">{rowContent}</div>
            )}
            {hasDetails ? (
              <ExpandableDetails expanded={expanded} className="px-3 pb-3 pl-8">
                <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  {details}
                </p>
              </ExpandableDetails>
            ) : null}
          </div>
        );
      })}
    </ThemedSurface>
  );
}
