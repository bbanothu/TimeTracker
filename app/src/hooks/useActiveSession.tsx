import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { initializeAppData, isDatabaseReady } from '@/services/appInitService';
import {
  disableBackgroundGeofencing,
  ensureUnknownLocationSession,
  isActiveUnknownSession,
  reconcileUnknownSession,
  requestBackgroundPermissions,
  suppressUnknownAutoTracking,
  syncGeofencingTask,
} from '@/services/geofenceService';
import { syncGoogleCalendar } from '@/services/googleCalendarService';
import {
  cancelSessionAlarmNotification,
  dismissGeofenceNotification,
  rescheduleActiveSessionAlarms,
  scheduleSessionAlarmNotification,
} from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { startDailyGoalScoreScheduler } from '@/services/dailyGoalScoreService';
import { timerService } from '@/services/timerService';
import { addWatchRequestListener, isWatchBridgeSupported } from '../../modules/watch-bridge';
import {
  pushWatchState,
  refreshWatchUserProfile,
  clearWatchUserProfile,
  refreshWatchAccountAndPush,
} from '@/services/watchBridgeService';
import type { ActiveSession, TimeEntry } from '@/types';
import { GeofenceMonitoringProvider } from '@/hooks/useGeofenceMonitoring';
import { formatTagName } from '@/utils/formatDuration';

interface TimerContextValue {
  ready: boolean;
  sessions: ActiveSession[];
  todayEntries: TimeEntry[];
  entriesRevision: number;
  tick: number;
  refresh: () => void;
  startManual: (tagIds: string[]) => void;
  startAlarm: (tagIds: string[], alarmAt: number) => Promise<void>;
  extendAlarm: (sessionId: string, extraMs: number) => Promise<void>;
  stop: (sessionId: string) => void;
  addManualEntry: (tagIds: string[], startedAt: number, endedAt: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function tagLabelForSession(session: ActiveSession): string {
  return session.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session';
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [entriesRevision, setEntriesRevision] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    if (!user || !isDatabaseReady()) return;
    const nextSessions = timerService.getActiveSessions();
    setSessions(nextSessions);
    setTodayEntries(timerService.getTodayEntries());
    setEntriesRevision((value) => value + 1);
    reconcileUnknownSession().catch(console.warn);
    pushWatchState(true, nextSessions);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setReady(false);
      clearWatchUserProfile();
      pushWatchState(false, []);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await initializeAppData(user.id);
        await refreshWatchUserProfile(user.id);
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
    if (!ready) return;
    rescheduleActiveSessionAlarms().catch(console.warn);
  }, [ready]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [sessions.length]);

  const startManual = useCallback(
    (tagIds: string[]) => {
      timerService.startManual(tagIds);
      refresh();
      notifyDataRefresh();
      ensureUnknownLocationSession(false).catch(console.warn);
      if (user) {
        pushChangesInBackground(user.id);
      }
    },
    [refresh, user],
  );

  const startAlarm = useCallback(
    async (tagIds: string[], alarmAt: number) => {
      // Cancel notifications for any previous alarm sessions before starting.
      for (const session of timerService.getActiveSessions()) {
        if (session.alarmAt != null) {
          await cancelSessionAlarmNotification(session.id);
        }
      }

      const session = timerService.startAlarm(tagIds, alarmAt);
      await scheduleSessionAlarmNotification(session.id, alarmAt, tagLabelForSession(session));
      refresh();
      notifyDataRefresh();
      ensureUnknownLocationSession(false).catch(console.warn);
      if (user) {
        pushChangesInBackground(user.id);
      }
    },
    [refresh, user],
  );

  const extendAlarm = useCallback(
    async (sessionId: string, extraMs: number) => {
      const alarmAt = Date.now() + extraMs;
      const session = timerService.extendAlarm(sessionId, alarmAt);
      await scheduleSessionAlarmNotification(sessionId, alarmAt, tagLabelForSession(session));
      refresh();
      notifyDataRefresh();
    },
    [refresh],
  );

  const stop = useCallback(
    (sessionId: string) => {
      const session = timerService.getActiveSessions().find((item) => item.id === sessionId);
      const stoppingUnknown = session ? isActiveUnknownSession(session) : false;
      if (stoppingUnknown) {
        suppressUnknownAutoTracking();
      }
      if (session?.alarmAt != null) {
        cancelSessionAlarmNotification(sessionId).catch(console.warn);
      }
      timerService.stop(sessionId);
      refresh();
      if (session?.geofenceId) {
        dismissGeofenceNotification(session.geofenceId).catch(console.warn);
      }
      if (!stoppingUnknown) {
        ensureUnknownLocationSession(false).catch(console.warn);
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

  useEffect(() => {
    if (!ready || !isWatchBridgeSupported()) return;

    const subscription = addWatchRequestListener((request) => {
      const action = request.action;
      if (action === 'start' && request.tagId) {
        startManual([request.tagId]);
        return;
      }
      if (action === 'startAlarm' && request.tagId && request.durationMinutes) {
        const minutes = Math.max(1, Math.round(Number(request.durationMinutes)));
        void startAlarm([request.tagId], Date.now() + minutes * 60_000);
        return;
      }
      if (action === 'logSession' && request.tagId) {
        let startedAt: number | undefined;
        let endedAt: number | undefined;
        if (request.startedAt != null && request.endedAt != null) {
          startedAt = Number(request.startedAt);
          endedAt = Number(request.endedAt);
        } else if (request.durationMinutes) {
          const minutes = Math.max(1, Math.round(Number(request.durationMinutes)));
          endedAt = Date.now();
          startedAt = endedAt - minutes * 60_000;
        }
        if (
          startedAt == null ||
          endedAt == null ||
          !Number.isFinite(startedAt) ||
          !Number.isFinite(endedAt) ||
          endedAt <= startedAt
        ) {
          console.warn('[WatchBridge] logSession invalid range', request);
          return;
        }
        addManualEntry([request.tagId], startedAt, endedAt);
        return;
      }
      if (action === 'stop' && request.sessionId) {
        stop(request.sessionId);
        return;
      }
      if (action === 'syncCalendar') {
        void (async () => {
          try {
            await syncGoogleCalendar();
          } catch (error) {
            console.warn('[WatchBridge] syncCalendar failed', error);
          }
          await refreshWatchAccountAndPush(timerService.getActiveSessions());
        })();
        return;
      }
      if (action === 'setAutoTracking') {
        void (async () => {
          try {
            if (request.enabled) {
              const granted = await requestBackgroundPermissions();
              if (granted) {
                await syncGeofencingTask();
              }
            } else {
              await disableBackgroundGeofencing();
            }
          } catch (error) {
            console.warn('[WatchBridge] setAutoTracking failed', error);
          }
          await refreshWatchAccountAndPush(timerService.getActiveSessions());
        })();
        return;
      }
      if (action === 'signOut') {
        void signOut().catch((error) => {
          console.warn('[WatchBridge] signOut failed', error);
        });
        return;
      }
      if (action === 'refreshAccount') {
        void refreshWatchAccountAndPush(timerService.getActiveSessions());
      }
    });

    return () => subscription?.remove();
  }, [ready, startManual, startAlarm, stop, signOut, addManualEntry]);

  const value = useMemo(
    () => ({
      ready,
      sessions,
      todayEntries,
      entriesRevision,
      tick,
      refresh,
      startManual,
      startAlarm,
      extendAlarm,
      stop,
      addManualEntry,
    }),
    [
      ready,
      sessions,
      todayEntries,
      entriesRevision,
      tick,
      refresh,
      startManual,
      startAlarm,
      extendAlarm,
      stop,
      addManualEntry,
    ],
  );

  return (
    <TimerContext.Provider value={value}>
      <GeofenceMonitoringProvider ready={ready} onRegionChange={refresh}>
        {children}
      </GeofenceMonitoringProvider>
    </TimerContext.Provider>
  );
}

export function useActiveSession() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useActiveSession must be used within TimerProvider');
  }
  return context;
}
