import { useCallback, useState } from 'react';
import type { RefreshControlProps } from 'react-native';

import { isDatabaseReady } from '@/db/client';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/hooks/useAuth';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { syncProfilePhotoFromCloud } from '@/services/profilePhotoService';
import { syncService } from '@/services/syncService';

export function useTabRefresh(onRefreshExtra?: () => void | Promise<void>) {
  const { user } = useAuth();
  const colors = useAppColors();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user?.id && isDatabaseReady()) {
        try {
          await syncService.pull(user.id, { fullPull: true });
          await syncProfilePhotoFromCloud(user.id);
        } catch (error) {
          console.warn('Cloud pull failed:', error);
        }
      }
      notifyDataRefresh();
      await onRefreshExtra?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshExtra, user?.id]);

  const refreshControlProps: RefreshControlProps = {
    refreshing,
    onRefresh,
    tintColor: colors.primary,
    colors: [colors.primary],
    progressBackgroundColor: colors.surface,
  };

  return { refreshing, onRefresh, refreshControlProps };
}
