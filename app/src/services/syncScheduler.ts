import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncService, type SyncResult } from '@/services/syncService';

const LAST_SYNC_KEY = 'timetracker_last_sync';

export async function getLastSyncAt(): Promise<number | null> {
  const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function markSyncAt(timestamp: number = Date.now()): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, String(timestamp));
}

function shouldMarkSyncTime(result: SyncResult): boolean {
  return result.pushed || result.pulled;
}

export async function performManualSync(userId: string): Promise<SyncResult> {
  const result = await syncService.uploadToCloud(userId);
  if (shouldMarkSyncTime(result)) {
    await markSyncAt();
  }
  return result;
}

export const syncScheduler = {
  getLastSyncAt,
  performManualSync,
};

// Backwards-compatible alias for profile screen.
export const getLastAutoSyncAt = getLastSyncAt;
