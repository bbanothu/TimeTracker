import { useCallback, useEffect, useState } from 'react';

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

  return { photoUri, setPhotoUri, refresh };
}
