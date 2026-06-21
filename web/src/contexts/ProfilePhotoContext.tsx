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
import {
  clearProfilePhotoCache,
  fetchProfilePhotoUrl,
  uploadProfilePhoto,
} from '@/services/profilePhotoService';

interface ProfilePhotoContextValue {
  photoUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  uploadPhoto: (file: File) => Promise<void>;
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue | null>(null);

export function ProfilePhotoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setPhotoUrl(null);
      return;
    }

    setLoading(true);
    try {
      const url = await fetchProfilePhotoUrl(user.id);
      setPhotoUrl(url);
    } catch (error) {
      console.warn('Profile photo fetch failed:', error);
    } finally {
      setLoading(false);
    }
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
    return () => {
      if (user) clearProfilePhotoCache(user.id);
    };
  }, [user]);

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!user) return;
      await uploadProfilePhoto(user.id, file);
      clearProfilePhotoCache(user.id);
      await refresh();
    },
    [user, refresh],
  );

  const value = useMemo(
    () => ({ photoUrl, loading, refresh, uploadPhoto }),
    [photoUrl, loading, refresh, uploadPhoto],
  );

  return <ProfilePhotoContext.Provider value={value}>{children}</ProfilePhotoContext.Provider>;
}

export function useProfilePhoto() {
  const context = useContext(ProfilePhotoContext);
  if (!context) throw new Error('useProfilePhoto must be used within ProfilePhotoProvider');
  return context;
}
