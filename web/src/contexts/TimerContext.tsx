import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/contexts/TagsContext';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { getStopCoordinates } from '@/lib/stopLocation';
import {
  completeTimeEntry,
  createTimeEntry,
  fetchActiveSessions,
  fetchEntries,
  startActiveEntry,
} from '@/services/data';
import {
  clearSessionAlarmAt,
  setSessionAlarmAt,
} from '@/services/sessionAlarmStore';
import {
  cancelWebSessionAlarm,
  rescheduleWebSessionAlarms,
  scheduleWebSessionAlarm,
} from '@/services/webSessionAlarm';
import type { ActiveSession, Tag, TimeEntry } from '@/types';
import { formatTagName } from '@/utils/formatDuration';

interface TimerContextValue {
  ready: boolean;
  sessions: ActiveSession[];
  todayEntries: TimeEntry[];
  entriesRevision: number;
  tick: number;
  startManual: (tagIds: string[]) => Promise<void>;
  startAlarm: (tagIds: string[], alarmAt: number) => Promise<void>;
  extendAlarm: (sessionId: string, extraMs: number) => Promise<void>;
  stop: (sessionId: string) => Promise<string | null>;
  addManualEntry: (tagIds: string[], startedAt: number, endedAt: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function startOfTodayMs() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function endOfTodayMs() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function labelForTagIds(tagIds: string[], tags: Tag[]): string {
  const labels = tagIds
    .map((id) => tags.find((tag) => tag.id === id)?.name)
    .filter((name): name is string => !!name)
    .map((name) => formatTagName(name));
  return labels.join(', ') || 'Session';
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { tags } = useTags();
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [entriesRevision, setEntriesRevision] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setTodayEntries([]);
      setReady(false);
      return;
    }

    const [activeSessions, entries] = await Promise.all([
      fetchActiveSessions(user.id),
      fetchEntries(user.id, startOfTodayMs(), endOfTodayMs()),
    ]);
    setSessions(activeSessions);
    setTodayEntries(entries);
    setEntriesRevision((value) => value + 1);
    setReady(true);
  }, [user]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      refresh().catch(console.error);
    });
  }, [user, refresh]);

  useEffect(() => {
    if (!user || !ready) return;

    const pollActiveSessions = () => {
      fetchActiveSessions(user.id).then(setSessions).catch(console.error);
    };

    const interval = setInterval(pollActiveSessions, 15000);
    const handleFocus = () => {
      pollActiveSessions();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, ready]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [sessions.length]);

  useEffect(() => {
    rescheduleWebSessionAlarms(
      sessions.map((session) => ({
        id: session.id,
        alarmAt: session.alarmAt,
        tagLabel: labelForTagIds(session.tagIds, tags),
      })),
    );
  }, [sessions, tags]);

  const startManual = useCallback(
    async (tagIds: string[]) => {
      if (!user) throw new Error('Sign in to start tracking');
      if (tagIds.length === 0) throw new Error('Select at least one tag');

      await startActiveEntry(user.id, {
        source: 'manual',
        geofenceId: null,
        tagIds,
      });

      notifyDataRefresh();
      await refresh();
    },
    [user, refresh],
  );

  const startAlarm = useCallback(
    async (tagIds: string[], alarmAt: number) => {
      if (!user) throw new Error('Sign in to start tracking');
      if (tagIds.length === 0) throw new Error('Select at least one tag');
      if (alarmAt <= Date.now() + 5_000) {
        throw new Error('Alarm must be at least a few seconds in the future');
      }

      for (const session of sessions) {
        if (session.alarmAt != null) {
          clearSessionAlarmAt(session.id);
          cancelWebSessionAlarm(session.id);
        }
      }

      const sessionId = await startActiveEntry(user.id, {
        source: 'manual',
        geofenceId: null,
        tagIds,
      });
      setSessionAlarmAt(sessionId, alarmAt);
      await scheduleWebSessionAlarm(sessionId, alarmAt, labelForTagIds(tagIds, tags));

      notifyDataRefresh();
      await refresh();
    },
    [user, refresh, sessions, tags],
  );

  const extendAlarm = useCallback(
    async (sessionId: string, extraMs: number) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) throw new Error('Session not found');

      const alarmAt = Date.now() + extraMs;
      setSessionAlarmAt(sessionId, alarmAt);
      await scheduleWebSessionAlarm(sessionId, alarmAt, labelForTagIds(session.tagIds, tags));
      notifyDataRefresh();
      await refresh();
    },
    [sessions, tags, refresh],
  );

  const stop = useCallback(
    async (sessionId: string): Promise<string | null> => {
      if (!user) return null;

      const session = sessions.find((item) => item.id === sessionId);
      if (!session) return null;

      if (session.alarmAt != null) {
        clearSessionAlarmAt(sessionId);
        cancelWebSessionAlarm(sessionId);
      }

      const coords = await getStopCoordinates();
      await completeTimeEntry(user.id, sessionId, {
        endedAt: Date.now(),
        stopLatitude: coords?.latitude ?? null,
        stopLongitude: coords?.longitude ?? null,
      });

      notifyDataRefresh();
      await refresh();
      return sessionId;
    },
    [user, sessions, refresh],
  );

  const addManualEntry = useCallback(
    async (tagIds: string[], startedAt: number, endedAt: number) => {
      if (!user) throw new Error('Sign in to add sessions');
      if (tagIds.length === 0) throw new Error('Select at least one tag');
      if (endedAt <= startedAt) throw new Error('End must be after start');
      if (endedAt > Date.now()) throw new Error('End cannot be in the future');

      await createTimeEntry(user.id, {
        startedAt,
        endedAt,
        source: 'manual',
        geofenceId: null,
        tagIds,
      });

      notifyDataRefresh();
      await refresh();
    },
    [user, refresh],
  );

  const value = useMemo(
    () => ({
      ready,
      sessions,
      todayEntries,
      entriesRevision,
      tick,
      startManual,
      startAlarm,
      extendAlarm,
      stop,
      addManualEntry,
      refresh,
    }),
    [
      ready,
      sessions,
      todayEntries,
      entriesRevision,
      tick,
      startManual,
      startAlarm,
      extendAlarm,
      stop,
      addManualEntry,
      refresh,
    ],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
}
