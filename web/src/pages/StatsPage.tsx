import { useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { PageLoading } from '@/components/ui/PageLoading';
import { ChartTypeSelector } from '@/components/ui/stats/ChartTypeSelector';
import { DayHistoryView } from '@/components/ui/stats/DayHistoryView';
import {
  ListView,
  OverviewView,
  StackedView,
  TrendView,
} from '@/components/ui/stats/StatsChartViews';
import { StatsKpiRow } from '@/components/ui/stats/StatsKpiRow';
import { StatsPeriodToolbar } from '@/components/ui/stats/StatsPeriodToolbar';
import { StatsPersonSelector } from '@/components/ui/stats/StatsPersonSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTrackingData } from '@/contexts/TrackingDataContext';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { fetchFriendEntries, fetchFriendGeofences } from '@/services/friendsService';
import { getStatsSummary } from '@/services/statsService';
import { getPeriodBounds } from '@/utils/periodBounds';
import { filterAnalyticsVisibleItems } from '@/utils/tagAnalytics';
import type { Geofence, PeriodType, StatsSummary, StatsVisualization, TimeEntry } from '@/types';

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

export function StatsPage() {
  const location = useLocation();
  const colors = useAppColors();
  const { user } = useAuth();
  const {
    entries: ownEntries,
    geofences: ownGeofences,
    friends,
    ready,
    refreshFriends,
  } = useTrackingData();
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [friendEntries, setFriendEntries] = useState<TimeEntry[]>([]);
  const [friendGeofences, setFriendGeofences] = useState<Geofence[]>([]);
  const [friendDataUserId, setFriendDataUserId] = useState<string | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  const isViewingFriend = Boolean(user && selectedUserId && selectedUserId !== user.id);
  const friendDataReady = !isViewingFriend || friendDataUserId === selectedUserId;

  const loadFriendData = useCallback(async (friendUserId: string) => {
    setFriendLoading(true);
    try {
      const [nextEntries, nextGeofences] = await Promise.all([
        fetchFriendEntries(friendUserId),
        fetchFriendGeofences(friendUserId),
      ]);
      setFriendEntries(nextEntries);
      setFriendGeofences(nextGeofences);
      setFriendDataUserId(friendUserId);
    } finally {
      setFriendLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/stats') {
      refreshFriends().catch(console.error);
    }
  }, [location.pathname, refreshFriends]);

  useEffect(() => {
    setSelectedUserId((current) => {
      if (current && !friends.some((friend) => friend.userId === current)) return null;
      return current;
    });
  }, [friends]);

  useEffect(() => {
    if (!isViewingFriend || !selectedUserId) {
      setFriendDataUserId(null);
      return;
    }
    loadFriendData(selectedUserId).catch(console.error);
  }, [isViewingFriend, selectedUserId, loadFriendData]);

  useEffect(() => {
    if (!user || !isViewingFriend || !selectedUserId) return;
    return subscribeDataRefresh(() => {
      loadFriendData(selectedUserId).catch(console.error);
    });
  }, [user, isViewingFriend, selectedUserId, loadFriendData]);

  const entries = isViewingFriend && friendDataReady ? friendEntries : ownEntries;
  const geofences = isViewingFriend && friendDataReady ? friendGeofences : ownGeofences;

  const summary = useMemo(
    () => getStatsSummary(anchorDate, period, entries, geofences),
    [anchorDate, period, entries, geofences],
  );

  const geofenceNames = useMemo(
    () => new Map(geofences.map((geofence) => [geofence.id, geofence.name])),
    [geofences],
  );

  const dayEntries = useMemo(() => {
    const { start, end } = getPeriodBounds(anchorDate, 'day');
    const rangeStart = start.getTime();
    const rangeEnd = end.getTime();

    return filterAnalyticsVisibleItems(
      entries.filter(
        (entry) =>
          entry.endedAt != null && entry.endedAt > rangeStart && entry.startedAt < rangeEnd,
      ),
    ).sort((a, b) => b.startedAt - a.startedAt);
  }, [entries, anchorDate]);

  if (!ready || !vizReady || !user) {
    return <PageLoading />;
  }

  return (
    <div className="lg:pb-2">
      <PageHeader title="Stats" className="mb-0 lg:mb-0" />

      <div className="mb-4 flex flex-col gap-4 lg:mb-5">
        <div className="flex flex-col gap-3 lg:items-end">
          {friends.length > 0 ? (
            <StatsPersonSelector
              friends={friends}
              selectedUserId={selectedUserId}
              selfUserId={user.id}
              onChange={setSelectedUserId}
            />
          ) : null}
          <StatsPeriodToolbar
            period={period}
            anchorDate={anchorDate}
            isViewingFriend={isViewingFriend}
            onPeriodChange={setPeriod}
            onAnchorDateChange={setAnchorDate}
          />
        </div>
      </div>

      {isViewingFriend && !friendDataReady ? (
        <div className="flex items-center gap-2 py-10">
          <LoadingIndicator size="small" />
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Loading friend stats…
          </p>
        </div>
      ) : (
        <>
          {friendLoading ? (
            <div className="mb-3 flex items-center gap-2">
              <LoadingIndicator size="small" />
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Updating…
              </p>
            </div>
          ) : null}

          <StatsKpiRow summary={summary} />

          <ChartTypeSelector
            period={period}
            visualization={visualization}
            onChange={setVisualization}
            className="lg:flex lg:justify-start"
          />

          <div className="min-w-0">
            <VisualizationContent
              summary={summary}
              visualization={visualization}
              period={period}
              dayEntries={dayEntries}
              geofenceNames={geofenceNames}
            />
          </div>
        </>
      )}
    </div>
  );
}
