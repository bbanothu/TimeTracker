import { useCallback, useEffect, useState } from 'react';

import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { getProfilePhotoUri } from '@/services/profilePhotoService';

export function useProfilePhoto(userId: string | undefined) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setPhotoUri(null);
      return;
    }

    getProfilePhotoUri(userId)
      .then(setPhotoUri)
      .catch(() => setPhotoUri(null));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    return subscribeDataRefresh(refresh);
  }, [userId, refresh]);

  return { photoUri, setPhotoUri, refresh };
}
