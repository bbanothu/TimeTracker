import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { StatsSummary } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

export function StatsKpiCard({ summary }: { summary: StatsSummary }) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 p-4">
      <p className="mb-1 text-sm" style={{ color: colors.textMuted }}>
        Total tracked
      </p>
      <p className="text-2xl font-bold" style={{ color: colors.text }}>
        {formatDurationLong(summary.totalMs)}
      </p>
      <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {summary.entryCount} entries
        {summary.topTag ? ` · Top tag ${formatTagName(summary.topTag.name)}` : ''}
      </p>
    </ThemedSurface>
  );
}
