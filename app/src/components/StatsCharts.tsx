import { ScrollView } from 'react-native';

import { BarsView, OverviewView } from '@/components/stats/BarsAndOverviewViews';
import { DayHistoryView } from '@/components/stats/DayHistoryView';
import { ListView, TrendView } from '@/components/stats/ListAndTrendViews';
import { StackedView } from '@/components/stats/StackedView';
import { StatsKpiCard } from '@/components/stats/StatsKpiCard';
import type { PeriodType, StatsSummary, StatsVisualization, TimeEntry } from '@/types';

interface StatsChartsProps {
  summary: StatsSummary;
  visualization: StatsVisualization;
  period: PeriodType;
  dayEntries: TimeEntry[];
  geofenceNames: Map<string, string>;
  scrollEnabled?: boolean;
}

function VisualizationContent({
  summary,
  visualization,
  period,
  dayEntries,
  geofenceNames,
}: {
  summary: StatsSummary;
  visualization: StatsVisualization;
  period: PeriodType;
  dayEntries: TimeEntry[];
  geofenceNames: Map<string, string>;
}) {
  const effectiveVisualization =
    period === 'day' && visualization === 'trend'
      ? 'overview'
      : period !== 'day' && visualization === 'history'
        ? 'overview'
        : visualization;

  switch (effectiveVisualization) {
    case 'history':
      return <DayHistoryView entries={dayEntries} geofenceNames={geofenceNames} />;
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
  dayEntries,
  geofenceNames,
  scrollEnabled = true,
}: StatsChartsProps) {
  const content = (
    <>
      <StatsKpiCard summary={summary} />
      <VisualizationContent
        summary={summary}
        visualization={visualization}
        period={period}
        dayEntries={dayEntries}
        geofenceNames={geofenceNames}
      />
    </>
  );

  if (!scrollEnabled) {
    return content;
  }

  return <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>;
}
