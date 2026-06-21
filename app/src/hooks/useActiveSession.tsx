import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { initDatabase } from '@/db/client';
import { useAuth } from '@/hooks/useAuth';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { syncGeofencingTask } from '@/services/geofenceService';
import { dismissGeofenceNotification, setupNotifications } from '@/services/notificationService';
import { syncService } from '@/services/syncService';
import { timerService } from '@/services/timerService';
import type { ActiveSession, TimeEntry } from '@/types';

interface TimerContextValue {
  ready: boolean;
  session: ActiveSession | null;
  todayEntries: TimeEntry[];
  entriesRevision: number;
  refresh: () => void;
  startManual: (tagIds: string[]) => void;
  stop: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [entriesRevision, setEntriesRevision] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    if (!user) return;
    setSession(timerService.getActiveSession());
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
        initDatabase(user.id);
        await setupNotifications();
        await syncService.seedRemoteDefaultsIfEmpty(user.id);
        await syncService.sync(user.id);
        await syncGeofencingTask();
        if (!cancelled) {
          setReady(true);
          refresh();
        }
      } catch (error) {
        console.error('Database init failed:', error);
        if (!cancelled) {
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
    if (!user) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncService
          .sync(user.id)
          .then(async () => {
            await syncGeofencingTask();
            refresh();
          })
          .catch(console.warn);
      }
    });

    return () => subscription.remove();
  }, [user?.id, refresh]);

  useEffect(() => {
    return subscribeDataRefresh(refresh);
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.id]);

  const startManual = useCallback(
    (tagIds: string[]) => {
      timerService.startManual(tagIds);
      refresh();
    },
    [refresh],
  );

  const stop = useCallback(() => {
    const geofenceId = timerService.getActiveSession()?.geofenceId;
    timerService.stop();
    refresh();
    if (geofenceId) {
      dismissGeofenceNotification(geofenceId).catch(console.warn);
    }
    if (user) {
      syncService.push(user.id).catch(console.warn);
    }
  }, [refresh, user]);

  const value = useMemo(
    () => ({
      ready,
      session,
      todayEntries,
      entriesRevision,
      refresh,
      startManual,
      stop,
    }),
    [ready, session, todayEntries, entriesRevision, refresh, startManual, stop, tick],
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
