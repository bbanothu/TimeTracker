import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChartTypeSelector } from '@/components/ui/stats/ChartTypeSelector';
import {
  ListView,
  OverviewView,
  StackedView,
  TrendView,
} from '@/components/ui/stats/StatsChartViews';
import { StatsKpiCard } from '@/components/ui/stats/StatsKpiCard';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { fetchAllEntries, fetchGeofences } from '@/services/data';
import { getStatsSummary } from '@/services/statsService';
import type { Geofence, PeriodType, StatsSummary, StatsVisualization, TimeEntry } from '@/types';
import { formatPeriodLabel, shiftPeriod } from '@/utils/periodBounds';

function VisualizationContent({
  summary,
  visualization,
}: {
  summary: StatsSummary;
  visualization: StatsVisualization;
}) {
  switch (visualization) {
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

export function StatsPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextEntries, nextGeofences] = await Promise.all([
        fetchAllEntries(user.id),
        fetchGeofences(user.id),
      ]);
      setEntries(nextEntries);
      setGeofences(nextGeofences);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData().catch(console.error);
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      loadData().catch(console.error);
    });
  }, [user, loadData]);

  const summary = useMemo(
    () => getStatsSummary(anchorDate, period, entries, geofences),
    [anchorDate, period, entries, geofences],
  );

  if (loading || !vizReady) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Stats
      </h1>

      <ThemedSurface className="mb-4 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(['day', 'week', 'month'] as PeriodType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className="rounded-lg px-3 py-2 text-sm font-semibold capitalize"
              style={{
                backgroundColor: period === item ? colors.selectedBg : colors.secondaryBg,
                color: period === item ? colors.selectedText : colors.textMuted,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setAnchorDate(shiftPeriod(anchorDate, period, -1))}>
            ←
          </button>
          <p className="text-sm font-medium" style={{ color: colors.text }}>
            {formatPeriodLabel(anchorDate, period)}
          </p>
          <button type="button" onClick={() => setAnchorDate(shiftPeriod(anchorDate, period, 1))}>
            →
          </button>
        </div>
      </ThemedSurface>

      <ChartTypeSelector visualization={visualization} onChange={setVisualization} />
      <StatsKpiCard summary={summary} />
      <VisualizationContent summary={summary} visualization={visualization} />
    </div>
  );
}
