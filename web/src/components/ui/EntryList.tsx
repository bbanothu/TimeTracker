import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { TimeEntry } from '@/types';
import { formatDuration, formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
  geofenceNames?: Map<string, string>;
  showDate?: boolean;
  onDelete?: (entryId: string) => void;
}

function formatTimeRange(startedAt: number, endedAt: number, showDate: boolean): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const startTime = start.toLocaleTimeString([], timeOptions);
  const endTime = end.toLocaleTimeString([], timeOptions);

  if (!showDate) {
    return `${startTime} – ${endTime}`;
  }

  const sameDay = start.toDateString() === end.toDateString();
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startDate = start.toLocaleDateString([], dateOptions);

  if (sameDay) {
    return `${startDate}, ${startTime} – ${endTime}`;
  }

  const endDate = end.toLocaleDateString([], dateOptions);
  return `${startDate} ${startTime} – ${endDate} ${endTime}`;
}

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  geofenceNames,
  showDate = false,
  onDelete,
}: EntryListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (entryId: string) => {
    setExpandedId((current) => (current === entryId ? null : entryId));
  };

  if (entries.length === 0) {
    return (
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {entries.map((entry, index) => {
        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt, showDate);
        const expanded = expandedId === entry.id;

        return (
          <div
            key={entry.id}
            style={
              index < entries.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
          >
            <button
              type="button"
              onClick={() => toggleExpanded(entry.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:opacity-90"
            >
              <div className="min-w-0 flex-1">
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
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    {expanded ? '▴' : '▾'}
                  </span>
                </div>
                {!expanded ? (
                  <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                    {timeRange}
                  </p>
                ) : null}
              </div>

              {!expanded ? (
                <span className="shrink-0 text-sm font-medium tabular-nums" style={{ color: colors.textSecondary }}>
                  {formatDurationLong(duration)}
                </span>
              ) : null}
            </button>

            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out"
              style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.length > 0 ? (
                          entry.tags.map((tag) => (
                            <span key={tag.id} className="font-semibold" style={{ color: tag.color }}>
                              {formatTagName(tag.name)}
                            </span>
                          ))
                        ) : (
                          <span className="font-semibold" style={{ color: colors.text }}>
                            Untagged
                          </span>
                        )}
                      </div>
                      {entry.source === 'geofence' && geofenceName ? (
                        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                          at {geofenceName}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                        {timeRange}
                      </p>
                      <span
                        className="mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: colors.selectedBg, color: colors.selectedText }}
                      >
                        {entry.source}
                      </span>
                    </div>
                    <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: colors.textOnBg }}>
                      {formatDuration(duration)}
                    </span>
                  </div>
                  {onDelete ? (
                    <ActionButton
                      label="Delete"
                      onClick={() => onDelete(entry.id)}
                      variant="destructiveOutline"
                      className="w-full"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
