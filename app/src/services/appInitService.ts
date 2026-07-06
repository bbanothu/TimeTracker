import {
  ensureDefaultUnknownPlace,
  initDatabase,
  isDatabaseReady,
  seedLocalDefaultTagsIfEmpty,
} from '@/db/client';
import { ensureUnknownLocationSession, syncGeofencingTask } from '@/services/geofenceService';
import { runDailyGoalScoreSnapshot } from '@/services/dailyGoalScoreService';
import { syncProfilePhotoFromCloud } from '@/services/profilePhotoService';
import { setupNotifications } from '@/services/notificationService';
import { syncService, waitForNetwork } from '@/services/syncService';

let pendingInit: { userId: string; promise: Promise<void> } | null = null;

export function clearPendingAppInit(): void {
  pendingInit = null;
}

export async function initializeAppData(userId: string): Promise<void> {
  if (pendingInit?.userId === userId) {
    return pendingInit.promise;
  }

  const promise = (async () => {
    initDatabase(userId);

    try {
      await setupNotifications();
    } catch (error) {
      console.warn('Notification setup failed:', error);
    }

    if (await waitForNetwork()) {
      try {
        await syncService.pull(userId, { fullPull: true });
        await syncProfilePhotoFromCloud(userId);
      } catch (error) {
        console.warn('Cloud download on login failed:', error);
      }
    }

    seedLocalDefaultTagsIfEmpty();
    ensureDefaultUnknownPlace();
    runDailyGoalScoreSnapshot(userId);

    try {
      await syncGeofencingTask();
      await ensureUnknownLocationSession(false);
    } catch (error) {
      console.warn('Geofence setup failed:', error);
    }
  })();

  pendingInit = { userId, promise };

  try {
    await promise;
  } finally {
    if (pendingInit?.userId === userId) {
      pendingInit = null;
    }
  }
}

export { isDatabaseReady };
