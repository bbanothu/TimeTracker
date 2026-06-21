import { Text, View } from 'react-native';

import { formatDurationLong, formatTagName } from '@/utils/formatDuration';
import type { StatsSummary } from '@/types';

export function StatsKpiCard({ summary }: { summary: StatsSummary }) {
  return (
    <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text className="mb-1 text-sm text-slate-500 dark:text-slate-400">Total tracked</Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {formatDurationLong(summary.totalMs)}
      </Text>
      <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {summary.entryCount} entries
        {summary.topTag ? ` · Top tag ${formatTagName(summary.topTag.name)}` : ''}
      </Text>
    </View>
  );
}
