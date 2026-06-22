import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { useActiveSession } from '@/hooks/useActiveSession';
import { getStatsSummary } from '@/services/statsService';
import type { PeriodType, StatsSummary } from '@/types';

const EMPTY_SUMMARY: StatsSummary = {
  totalMs: 0,
  entryCount: 0,
  topTag: null,
  byTag: [],
  byGeofence: [],
  buckets: [],
  bucketTagBreakdown: [],
};

export function useStats(initialPeriod: PeriodType = 'day') {
  const { ready, entriesRevision } = useActiveSession();
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [focusRevision, setFocusRevision] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusRevision((value) => value + 1);
    }, []),
  );

  const summary: StatsSummary = useMemo(
    () => (ready ? getStatsSummary(anchorDate, period) : EMPTY_SUMMARY),
    [ready, anchorDate, period, entriesRevision, focusRevision],
  );

  const shift = useCallback(
    (delta: number) => {
      setAnchorDate((current) => {
        const next = new Date(current);
        if (period === 'day') next.setDate(next.getDate() + delta);
        else if (period === 'week') next.setDate(next.getDate() + delta * 7);
        else next.setMonth(next.getMonth() + delta);
        return next;
      });
    },
    [period],
  );

  return { ready, period, setPeriod, anchorDate, setAnchorDate, summary, shift };
}
