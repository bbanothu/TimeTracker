import { useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ChartTypeSelector } from '@/components/ui/stats/ChartTypeSelector';
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
import { useTimer } from '@/contexts/TimerContext';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { fetchAllEntries, fetchGeofences } from '@/services/data';
import {
  fetchAcceptedFriends,
  fetchFriendEntries,
  fetchFriendGeofences,
} from '@/services/friendsService';
import { getStatsSummary } from '@/services/statsService';
import type {
  FriendshipOtherUser,
  Geofence,
  PeriodType,
  StatsSummary,
  StatsVisualization,
  TimeEntry,
} from '@/types';

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
  const colors = useAppColors();
  const location = useLocation();
  const { user } = useAuth();
  const { entriesRevision } = useTimer();
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [friends, setFriends] = useState<FriendshipOtherUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isViewingFriend = Boolean(user && selectedUserId && selectedUserId !== user.id);

  const loadFriends = useCallback(async () => {
    try {
      const accepted = await fetchAcceptedFriends();
      setFriends(accepted);
      setSelectedUserId((current) => {
        if (current && !accepted.some((f) => f.userId === current)) return null;
        return current;
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const targetId = selectedUserId && selectedUserId !== user.id ? selectedUserId : user.id;
      const [nextEntries, nextGeofences] = await Promise.all([
        targetId === user.id ? fetchAllEntries(user.id) : fetchFriendEntries(targetId),
        targetId === user.id ? fetchGeofences(user.id) : fetchFriendGeofences(targetId),
      ]);
      setEntries(nextEntries);
      setGeofences(nextGeofences);
    } finally {
      setLoading(false);
    }
  }, [user, selectedUserId]);

  useEffect(() => {
    if (location.pathname === '/stats') {
      loadFriends().catch(console.error);
    }
  }, [location.pathname, loadFriends]);

  useEffect(() => {
    loadData().catch(console.error);
  }, [loadData, entriesRevision]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      loadData().catch(console.error);
      if (!isViewingFriend) {
        loadFriends().catch(console.error);
      }
    });
  }, [user, loadData, loadFriends, isViewingFriend]);

  const summary = useMemo(
    () => getStatsSummary(anchorDate, period, entries, geofences),
    [anchorDate, period, entries, geofences],
  );

  if (loading || !vizReady || !user) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div className="lg:pb-2">
      <div className="mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader title="Stats" />
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

      <StatsKpiRow summary={summary} />

      <ChartTypeSelector
        period={period}
        visualization={visualization}
        onChange={setVisualization}
        className="lg:flex lg:justify-start"
      />

      <div className="min-w-0">
        <VisualizationContent summary={summary} visualization={visualization} period={period} />
      </div>
    </div>
  );
}
