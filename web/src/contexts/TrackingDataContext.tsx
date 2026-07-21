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
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { ensureDefaultUnknownPlace, fetchAllEntries, fetchGeofences } from '@/services/data';
import { fetchAcceptedFriends } from '@/services/friendsService';
import type { FriendshipOtherUser, Geofence, TimeEntry } from '@/types';

interface TrackingDataContextValue {
  entries: TimeEntry[];
  geofences: Geofence[];
  friends: FriendshipOtherUser[];
  ready: boolean;
  refresh: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  patchGeofence: (id: string, patch: Partial<Geofence>) => void;
  removeGeofence: (id: string) => void;
}

const TrackingDataContext = createContext<TrackingDataContextValue | null>(null);

export function TrackingDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [friends, setFriends] = useState<FriendshipOtherUser[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setGeofences([]);
      setFriends([]);
      setReady(false);
      return;
    }

    await ensureDefaultUnknownPlace(user.id);
    const [nextEntries, nextGeofences] = await Promise.all([
      fetchAllEntries(user.id),
      fetchGeofences(user.id),
    ]);
    setEntries(nextEntries);
    setGeofences(nextGeofences);
    setReady(true);
  }, [user]);

  const refreshFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      return;
    }

    try {
      setFriends(await fetchAcceptedFriends());
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const patchGeofence = useCallback((id: string, patch: Partial<Geofence>) => {
    setGeofences((current) =>
      current.map((geofence) => (geofence.id === id ? { ...geofence, ...patch } : geofence)),
    );
  }, []);

  const removeGeofence = useCallback((id: string) => {
    setGeofences((current) => current.filter((geofence) => geofence.id !== id));
  }, []);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      refresh().catch(console.error);
    });
  }, [user, refresh]);

  const value = useMemo(
    () => ({
      entries,
      geofences,
      friends,
      ready,
      refresh,
      refreshFriends,
      patchGeofence,
      removeGeofence,
    }),
    [entries, geofences, friends, ready, refresh, refreshFriends, patchGeofence, removeGeofence],
  );

  return <TrackingDataContext.Provider value={value}>{children}</TrackingDataContext.Provider>;
}

export function useTrackingData() {
  const context = useContext(TrackingDataContext);
  if (!context) throw new Error('useTrackingData must be used within TrackingDataProvider');
  return context;
}
