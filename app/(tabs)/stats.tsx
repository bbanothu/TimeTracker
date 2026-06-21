import { StatsCharts } from '@/components/StatsCharts';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useStats } from '@/hooks/useStats';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { Text, View } from 'react-native';

export default function StatsScreen() {
  const { ready, period, setPeriod, anchorDate, summary, shift } = useStats('week');
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();

  if (!ready || !vizReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Text className="text-slate-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-2 dark:bg-slate-950">
      <PeriodSelector
        period={period}
        anchorDate={anchorDate}
        onPeriodChange={setPeriod}
        onShift={shift}
      />
      <ChartTypeSelector visualization={visualization} onChange={setVisualization} />
      <StatsCharts summary={summary} visualization={visualization} />
    </View>
  );
}
