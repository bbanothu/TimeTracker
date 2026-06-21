import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { TimeEntry } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface EntryListProps {
  entries: TimeEntry[];
  emptyMessage?: string;
}

export function EntryList({ entries, emptyMessage = 'No entries yet' }: EntryListProps) {
  const colors = useAppColors();

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const duration = entry.endedAt - entry.startedAt;
        const tagLabel = entry.tags.map((tag) => formatTagName(tag.name)).join(' ');

        return (
          <ThemedSurface key={entry.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold" style={{ color: colors.text }}>
                {tagLabel || 'Untagged'}
              </p>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                {formatDurationLong(duration)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs" style={{ color: colors.textMuted }}>
              <span>
                {new Date(entry.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                {' – '}
                {new Date(entry.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span
                className="rounded-full px-2 py-1 font-medium"
                style={{ backgroundColor: colors.selectedBg, color: colors.selectedText }}
              >
                {entry.source}
              </span>
            </div>
          </ThemedSurface>
        );
      })}
    </div>
  );
}
