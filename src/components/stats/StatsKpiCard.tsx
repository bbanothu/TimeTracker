import { Text } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { StatsSummary } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

export function StatsKpiCard({ summary }: { summary: StatsSummary }) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 p-4">
      <Text className="mb-1 text-sm" style={{ color: colors.textMuted }}>
        Total tracked
      </Text>
      <Text className="text-2xl font-bold" style={{ color: colors.text }}>
        {formatDurationLong(summary.totalMs)}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {summary.entryCount} entries
        {summary.topTag ? ` · Top tag ${formatTagName(summary.topTag.name)}` : ''}
      </Text>
    </ThemedSurface>
  );
}
