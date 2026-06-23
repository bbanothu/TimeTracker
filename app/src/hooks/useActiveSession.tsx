import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { initializeAppData, isDatabaseReady } from '@/services/appInitService';
import { dismissGeofenceNotification } from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { startDailyGoalScoreScheduler } from '@/services/dailyGoalScoreService';
import { timerService } from '@/services/timerService';
import type { ActiveSession, TimeEntry } from '@/types';

interface TimerContextValue {
  ready: boolean;
  sessions: ActiveSession[];
  todayEntries: TimeEntry[];
  entriesRevision: number;
  tick: number;
  refresh: () => void;
  startManual: (tagIds: string[]) => void;
  stop: (sessionId: string) => void;
  addManualEntry: (tagIds: string[], startedAt: number, endedAt: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [entriesRevision, setEntriesRevision] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    if (!user || !isDatabaseReady()) return;
    setSessions(timerService.getActiveSessions());
    setTodayEntries(timerService.getTodayEntries());
    setEntriesRevision((value) => value + 1);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await initializeAppData(user.id);
        if (!cancelled) {
          setReady(true);
          refresh();
        }
      } catch (error) {
        console.error('Database init failed:', error);
        if (!cancelled && isDatabaseReady()) {
          setReady(true);
          refresh();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refresh]);

  useEffect(() => {
    if (!ready) return;
    return subscribeDataRefresh(refresh);
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready || !user) return;
    return startDailyGoalScoreScheduler(user.id);
  }, [ready, user?.id]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [sessions.length]);

  const startManual = useCallback(
    (tagIds: string[]) => {
      timerService.startManual(tagIds);
      refresh();
    },
    [refresh],
  );

  const stop = useCallback(
    (sessionId: string) => {
      const session = timerService.getActiveSessions().find((item) => item.id === sessionId);
      timerService.stop(sessionId);
      refresh();
      if (session?.geofenceId) {
        dismissGeofenceNotification(session.geofenceId).catch(console.warn);
      }
      if (user) {
        pushChangesInBackground(user.id);
      }
    },
    [refresh, user],
  );

  const addManualEntry = useCallback(
    (tagIds: string[], startedAt: number, endedAt: number) => {
      timerService.addManualEntry(tagIds, startedAt, endedAt);
      refresh();
      notifyDataRefresh();
      if (user) {
        pushChangesInBackground(user.id);
      }
    },
    [refresh, user],
  );

  const value = useMemo(
    () => ({
      ready,
      sessions,
      todayEntries,
      entriesRevision,
      tick,
      refresh,
      startManual,
      stop,
      addManualEntry,
    }),
    [ready, sessions, todayEntries, entriesRevision, tick, refresh, startManual, stop, addManualEntry],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useActiveSession() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useActiveSession must be used within TimerProvider');
  }
  return context;
}
