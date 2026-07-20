import { Fragment, useMemo, useState } from 'react';

import { ExpandableDetails, ExpandChevron } from '@/components/ui/ExpandableDetails';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { confirmDelete } from '@/lib/confirm';
import type { TimeEntry } from '@/types';
import { formatMergePreview, getMergePair } from '@/utils/entryMerge';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
  geofenceNames?: Map<string, string>;
  showDate?: boolean;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  onMerge?: (keepEntryId: string, deleteEntryId: string) => void;
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

function EditIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MergeIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth="1.75" />
      <circle cx="6" cy="18" r="2.5" stroke={color} strokeWidth="1.75" />
      <circle cx="18" cy="12" r="2.5" stroke={color} strokeWidth="1.75" />
      <path d="M8 7.5v9M8 12h8" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  geofenceNames,
  showDate = false,
  onEdit,
  onDelete,
  onMerge,
}: EntryListProps) {
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

  const completedEntries = useMemo(
    () => entries.filter((entry) => entry.endedAt != null),
    [entries],
  );

  if (completedEntries.length === 0) {
    return (
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  const handleMergePress = (index: number) => {
    const pair = getMergePair(completedEntries, index);
    if (!pair || !onMerge) return;

    const message = `Merge these into one session?\n${formatMergePreview(pair.older, pair.newer)}`;
    if (!window.confirm(message)) return;
    onMerge(pair.older.id, pair.newer.id);
  };

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {completedEntries.map((entry, index) => {
        const duration = entry.endedAt! - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Untagged';
        const geofenceName = entry.geofenceId ? geofenceNames?.get(entry.geofenceId) : null;
        const timeRange = formatTimeRange(entry.startedAt, entry.endedAt!, showDate);
        const subtitle =
          entry.source === 'geofence' && geofenceName
            ? `${timeRange} · @ ${geofenceName}`
            : timeRange;
        const mergePair = onMerge ? getMergePair(completedEntries, index) : null;
        const details = entry.details?.trim() ?? '';
        const hasDetails = details.length > 0;
        const expanded = expandedIds.has(entry.id);
        const showBottomBorder = index < completedEntries.length - 1 || mergePair;

        const mainContent = (
          <>
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
          </>
        );

        return (
          <Fragment key={entry.id}>
            <div
              style={
                showBottomBorder ? { borderBottom: `1px solid ${colors.surfaceBorder}` } : undefined
              }
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                {hasDetails ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(entry.id)}
                    aria-expanded={expanded}
                    className="min-w-0 flex-1 text-left transition hover:opacity-90"
                  >
                    {mainContent}
                  </button>
                ) : (
                  <div className="min-w-0 flex-1">{mainContent}</div>
                )}
                {hasDetails ? <ExpandChevron expanded={expanded} color={colors.textMuted} /> : null}
                <span
                  className="shrink-0 text-sm font-medium tabular-nums"
                  style={{ color: colors.textSecondary }}
                >
                  {formatDurationLong(duration)}
                </span>
                {onEdit ? (
                  <button
                    type="button"
                    aria-label={`Edit ${tagLabel}`}
                    title="Edit"
                    onClick={() => onEdit(entry)}
                    className="shrink-0 rounded p-1 transition hover:opacity-80"
                  >
                    <EditIcon color={colors.textMuted} />
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    aria-label={`Delete ${tagLabel}`}
                    title="Delete"
                    onClick={() => {
                      if (
                        !confirmDelete(
                          'Remove this tracked session permanently? This cannot be undone.',
                        )
                      ) {
                        return;
                      }
                      onDelete(entry.id);
                    }}
                    className="shrink-0 rounded p-1 transition hover:opacity-80"
                  >
                    <DeleteIcon color={colors.destructiveText} />
                  </button>
                ) : null}
              </div>
              {hasDetails ? (
                <ExpandableDetails expanded={expanded} className="px-3 pb-3 pl-8">
                  <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                    {details}
                  </p>
                </ExpandableDetails>
              ) : null}
            </div>
            {mergePair ? (
              <button
                type="button"
                onClick={() => handleMergePress(index)}
                aria-label="Merge with session below"
                className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                style={{
                  borderBottom:
                    index < completedEntries.length - 1
                      ? `1px solid ${colors.surfaceBorder}`
                      : undefined,
                  backgroundColor: colors.secondaryBgSolid,
                  color: colors.primary,
                }}
              >
                <MergeIcon color={colors.primary} />
                Merge
              </button>
            ) : null}
          </Fragment>
        );
      })}
    </ThemedSurface>
  );
}
