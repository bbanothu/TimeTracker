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
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import { getStopCoordinates } from '@/lib/stopLocation';
import {
  createTimeEntry,
  fetchEntries,
  loadActiveSessions,
  saveActiveSessions,
} from '@/services/data';
import type { ActiveSession, Tag, TimeEntry } from '@/types';

interface TimerContextValue {
  ready: boolean;
  sessions: ActiveSession[];
  todayEntries: TimeEntry[];
  entriesRevision: number;
  tick: number;
  startManual: (tagIds: string[]) => void;
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

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>(() => loadActiveSessions());
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [entriesRevision, setEntriesRevision] = useState(0);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setTodayEntries([]);
      setReady(false);
      return;
    }

    const entries = await fetchEntries(user.id, startOfTodayMs(), endOfTodayMs());
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
    saveActiveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [sessions.length]);

  const startManual = useCallback((tagIds: string[]) => {
    if (tagIds.length === 0) throw new Error('Select at least one tag');

    setSessions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        startedAt: Date.now(),
        source: 'manual',
        geofenceId: null,
        tagIds,
      },
    ]);
  }, []);

  const stop = useCallback(
    async (sessionId: string): Promise<string | null> => {
      if (!user) return null;

      const session = sessions.find((item) => item.id === sessionId);
      if (!session) return null;

      const coords = await getStopCoordinates();
      const entryId = await createTimeEntry(user.id, {
        startedAt: session.startedAt,
        endedAt: Date.now(),
        source: session.source,
        geofenceId: session.geofenceId,
        tagIds: session.tagIds,
        stopLatitude: coords?.latitude ?? null,
        stopLongitude: coords?.longitude ?? null,
      });

      setSessions((current) => current.filter((item) => item.id !== sessionId));
      await refresh();
      return entryId;
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
      stop,
      addManualEntry,
      refresh,
    }),
    [ready, sessions, todayEntries, entriesRevision, tick, startManual, stop, addManualEntry, refresh],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
}

export function useSessionTags(session: ActiveSession | null, tags: Tag[]) {
  return useMemo(() => {
    if (!session) return [];
    return tags.filter((tag) => session.tagIds.includes(tag.id));
  }, [session, tags]);
}
