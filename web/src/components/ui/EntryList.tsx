import { useState } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { TimeEntry } from '@/types';
import { formatDuration, formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
}

function formatTimeRange(startedAt: number, endedAt: number): string {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startedAt).toLocaleTimeString([], options)} – ${new Date(endedAt).toLocaleTimeString([], options)}`;
}

export function EntryList({ entries, emptyMessage = 'No entries yet' }: EntryListProps) {
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
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt);
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
                  <div className="flex items-start justify-between gap-3">
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
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
