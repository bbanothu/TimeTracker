import { ScrollView } from 'react-native';

import { BarsView, OverviewView } from '@/components/stats/BarsAndOverviewViews';
import { ListView, TrendView } from '@/components/stats/ListAndTrendViews';
import { StackedView } from '@/components/stats/StackedView';
import { StatsKpiCard } from '@/components/stats/StatsKpiCard';
import type { StatsSummary, StatsVisualization } from '@/types';

interface StatsChartsProps {
  summary: StatsSummary;
  visualization: StatsVisualization;
  scrollEnabled?: boolean;
}

function VisualizationContent({
  summary,
  visualization,
}: {
  summary: StatsSummary;
  visualization: StatsVisualization;
}) {
  switch (visualization) {
    case 'bars':
      return <BarsView summary={summary} />;
    case 'list':
      return <ListView summary={summary} />;
    case 'stacked':
      return <StackedView summary={summary} />;
    case 'trend':
      return <TrendView summary={summary} />;
    case 'overview':
    default:
      return <OverviewView summary={summary} />;
  }
}

export function StatsCharts({ summary, visualization, scrollEnabled = true }: StatsChartsProps) {
  const content = (
    <>
      <StatsKpiCard summary={summary} />
      <VisualizationContent summary={summary} visualization={visualization} />
    </>
  );

  if (!scrollEnabled) {
    return content;
  }

  return <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>;
}
