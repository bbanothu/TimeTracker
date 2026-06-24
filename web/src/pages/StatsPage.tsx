import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChartTypeSelector } from '@/components/ui/stats/ChartTypeSelector';
import {
  ListView,
  OverviewView,
  StackedView,
  TrendView,
} from '@/components/ui/stats/StatsChartViews';
import { StatsKpiCard } from '@/components/ui/stats/StatsKpiCard';
import { StatsPersonSelector } from '@/components/ui/stats/StatsPersonSelector';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
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
import type { FriendshipOtherUser, Geofence, PeriodType, StatsSummary, StatsVisualization, TimeEntry } from '@/types';
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
  const navigate = useNavigate();
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

  const isViewingFriend = Boolean(
    user && selectedUserId && selectedUserId !== user.id,
  );

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
      const targetId =
        selectedUserId && selectedUserId !== user.id ? selectedUserId : user.id;
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
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Stats
      </h1>

      <StatsPersonSelector
        friends={friends}
        selectedUserId={selectedUserId}
        selfUserId={user.id}
        onChange={setSelectedUserId}
      />

      <ThemedSurface className="mb-4 p-4">
        <div
          className="mb-3 grid grid-cols-4 gap-1 rounded-xl p-1"
          style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 }}
        >
          {(['day', 'week', 'month'] as PeriodType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className="rounded-lg px-2 py-2 text-sm font-semibold capitalize"
              style={{
                backgroundColor: period === item ? colors.selectedBg : 'transparent',
                color: period === item ? colors.selectedText : colors.textMuted,
              }}
            >
              {item}
            </button>
          ))}
          {isViewingFriend ? (
            <span
              className="rounded-lg px-2 py-2 text-center text-sm font-semibold"
              style={{ color: colors.textMuted, opacity: 0.45 }}
              title="Progress is only available for your own stats"
            >
              Progress
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/stats/progress?date=${encodeURIComponent(anchorDate.toISOString())}&period=${period}`,
                )
              }
              className="rounded-lg px-2 py-2 text-sm font-semibold"
              style={{ color: colors.textMuted }}
            >
              Progress
            </button>
          )}
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
