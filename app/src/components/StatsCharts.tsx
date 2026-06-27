import { ScrollView } from 'react-native';

import { BarsView, OverviewView } from '@/components/stats/BarsAndOverviewViews';
import { ListView, TrendView } from '@/components/stats/ListAndTrendViews';
import { StackedView } from '@/components/stats/StackedView';
import { StatsKpiCard } from '@/components/stats/StatsKpiCard';
import type { PeriodType, StatsSummary, StatsVisualization } from '@/types';

interface StatsChartsProps {
  summary: StatsSummary;
  visualization: StatsVisualization;
  period: PeriodType;
  scrollEnabled?: boolean;
}

function VisualizationContent({
  summary,
  visualization,
  period,
}: {
  summary: StatsSummary;
  visualization: StatsVisualization;
  period: PeriodType;
}) {
  const effectiveVisualization =
    period === 'day' && visualization === 'trend' ? 'overview' : visualization;

  switch (effectiveVisualization) {
    case 'bars':
      return <BarsView summary={summary} period={period} />;
    case 'list':
      return <ListView summary={summary} period={period} />;
    case 'stacked':
      return <StackedView summary={summary} />;
    case 'trend':
      return <TrendView summary={summary} />;
    case 'overview':
    default:
      return <OverviewView summary={summary} />;
  }
}

export function StatsCharts({
  summary,
  visualization,
  period,
  scrollEnabled = true,
}: StatsChartsProps) {
  const content = (
    <>
      <StatsKpiCard summary={summary} />
      <VisualizationContent summary={summary} visualization={visualization} period={period} />
    </>
  );

  if (!scrollEnabled) {
    return content;
  }

  return <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>;
}
