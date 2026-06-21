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
import {
  createTimeEntry,
  fetchEntries,
  loadActiveSession,
  saveActiveSession,
} from '@/services/data';
import type { ActiveSession, Tag, TimeEntry } from '@/types';

interface TimerContextValue {
  ready: boolean;
  session: ActiveSession | null;
  todayEntries: TimeEntry[];
  tick: number;
  startManual: (tagIds: string[]) => void;
  stop: () => Promise<void>;
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
  const [session, setSession] = useState<ActiveSession | null>(() => loadActiveSession());
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setTodayEntries([]);
      setReady(false);
      return;
    }

    const entries = await fetchEntries(user.id, startOfTodayMs(), endOfTodayMs());
    setTodayEntries(entries);
    setReady(true);
  }, [user]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    saveActiveSession(session);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.id]);

  const startManual = useCallback(
    (tagIds: string[]) => {
      if (tagIds.length === 0) throw new Error('Select at least one tag');
      if (session) throw new Error('A session is already running');

      setSession({
        id: crypto.randomUUID(),
        startedAt: Date.now(),
        source: 'manual',
        geofenceId: null,
        tagIds,
      });
    },
    [session],
  );

  const stop = useCallback(async () => {
    if (!user || !session) return;

    await createTimeEntry(user.id, {
      startedAt: session.startedAt,
      endedAt: Date.now(),
      source: session.source,
      geofenceId: session.geofenceId,
      tagIds: session.tagIds,
    });

    setSession(null);
    await refresh();
  }, [user, session, refresh]);

  const value = useMemo(
    () => ({
      ready,
      session,
      todayEntries,
      tick,
      startManual,
      stop,
      refresh,
    }),
    [ready, session, todayEntries, tick, startManual, stop, refresh],
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
