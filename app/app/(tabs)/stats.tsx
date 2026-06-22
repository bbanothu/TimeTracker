import { StatsCharts } from '@/components/StatsCharts';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { PeriodSelector } from '@/components/PeriodSelector';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { useStats } from '@/hooks/useStats';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { Text } from 'react-native';

export default function StatsScreen() {
  const { ready, period, setPeriod, anchorDate, summary, shift } = useStats('day');
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();

  if (!ready || !vizReady) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text className="text-white/70">Loading...</Text>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer className="px-4 pt-2">
      <TabScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <PeriodSelector
          period={period}
          anchorDate={anchorDate}
          onPeriodChange={setPeriod}
          onShift={shift}
        />
        <ChartTypeSelector visualization={visualization} onChange={setVisualization} />
        <StatsCharts summary={summary} visualization={visualization} scrollEnabled={false} />
      </TabScrollView>
    </TabScreenContainer>
  );
}
