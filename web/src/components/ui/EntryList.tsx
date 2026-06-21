import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { confirmDelete } from '@/lib/confirm';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

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

export function EntryList({
  entries,
  emptyMessage = 'No entries yet',
  geofenceNames,
  showDate = false,
  onDelete,
}: EntryListProps) {
  const colors = useAppColors();

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
        const subtitle =
          entry.source === 'geofence' && geofenceName ? `${timeRange} · @ ${geofenceName}` : timeRange;

        return (
          <div
            key={entry.id}
            className="flex items-center gap-2 px-3 py-2.5"
            style={
              index < entries.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
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
              </div>
              <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                {subtitle}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums" style={{ color: colors.textSecondary }}>
              {formatDurationLong(duration)}
            </span>
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
        );
      })}
    </ThemedSurface>
  );
}
