import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAllEntries, getAllGeofences } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { fetchFriendEntries, fetchFriendGeofences } from '@/services/friendsService';
import { getStatsSummary } from '@/services/statsService';
import type { Geofence, PeriodType, StatsSummary, TimeEntry } from '@/types';
import { ROLLING_MONTH_DAYS, ROLLING_WEEK_DAYS, getPeriodBounds } from '@/utils/periodBounds';

const EMPTY_SUMMARY: StatsSummary = {
  totalMs: 0,
  entryCount: 0,
  topTag: null,
  byTag: [],
  byGeofence: [],
  buckets: [],
  bucketTagBreakdown: [],
};

export function useStats(initialPeriod: PeriodType = 'day', subjectUserId?: string | null) {
  const { user } = useAuth();
  const { ready, entriesRevision } = useActiveSession();
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [focusRevision, setFocusRevision] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const isSelf = !subjectUserId || subjectUserId === user?.id;

  useFocusEffect(
    useCallback(() => {
      setFocusRevision((value) => value + 1);
    }, []),
  );

  const loadData = useCallback(async () => {
    if (!ready) return;

    if (isSelf) {
      setEntries(getAllEntries());
      setGeofences(getAllGeofences());
      return;
    }

    setDataLoading(true);
    try {
      const [nextEntries, nextGeofences] = await Promise.all([
        fetchFriendEntries(subjectUserId),
        fetchFriendGeofences(subjectUserId),
      ]);
      setEntries(nextEntries);
      setGeofences(nextGeofences);
    } catch (error) {
      console.error(error);
      setEntries([]);
      setGeofences([]);
    } finally {
      setDataLoading(false);
    }
  }, [ready, isSelf, subjectUserId]);

  useEffect(() => {
    loadData().catch(console.error);
  }, [loadData, entriesRevision, focusRevision]);

  const summary: StatsSummary = useMemo(
    () =>
      ready && !dataLoading
        ? getStatsSummary(anchorDate, period, entries, geofences)
        : EMPTY_SUMMARY,
    [ready, dataLoading, anchorDate, period, entries, geofences],
  );

  const geofenceNames = useMemo(
    () => new Map(geofences.map((geofence) => [geofence.id, geofence.name])),
    [geofences],
  );

  const dayEntries = useMemo(() => {
    const { start, end } = getPeriodBounds(anchorDate, 'day');
    const rangeStart = start.getTime();
    const rangeEnd = end.getTime();

    return entries
      .filter(
        (entry) =>
          entry.endedAt != null && entry.endedAt > rangeStart && entry.startedAt < rangeEnd,
      )
      .sort((a, b) => b.startedAt - a.startedAt);
  }, [entries, anchorDate]);

  const shift = useCallback(
    (delta: number) => {
      setAnchorDate((current) => {
        const next = new Date(current);
        if (period === 'day') next.setDate(next.getDate() + delta);
        else if (period === 'week') next.setDate(next.getDate() + delta * ROLLING_WEEK_DAYS);
        else next.setDate(next.getDate() + delta * ROLLING_MONTH_DAYS);
        return next;
      });
    },
    [period],
  );

  return {
    ready: ready && !dataLoading,
    period,
    setPeriod,
    anchorDate,
    setAnchorDate,
    summary,
    shift,
    geofenceNames,
    dayEntries,
    isViewingFriend: !isSelf,
  };
}
