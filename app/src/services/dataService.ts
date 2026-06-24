import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { clearAllTrackedData, getAllEntries, getAllTags, initDatabase } from '@/db/client';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { buildProfileDisplayName, fetchMyProfile } from '@/services/profileService';
import { aggregatedExportDayCount } from '@/utils/aggregatedExportCsv';

import { exportEntriesToCsv } from './exportService';

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected !== true) return false;
  if (Platform.OS === 'android') {
    return true;
  }
  return state.isInternetReachable !== false;
}

export async function clearTrackedData(userId: string): Promise<number> {
  initDatabase(userId);
  const deletedCount = clearAllTrackedData();

  if (isSupabaseConfigured && (await isOnline())) {
    const { error } = await supabase.from('time_entries').delete().eq('user_id', userId);
    if (error) throw error;
  }

  notifyDataRefresh();
  return deletedCount;
}

export async function exportTrackedDataCsv(userId: string): Promise<number> {
  initDatabase(userId);
  const entries = getAllEntries();
  const tags = getAllTags();

  if (entries.length === 0) {
    throw new Error('No time entries to export');
  }

  const profile = await fetchMyProfile().catch(() => ({
    firstName: '',
    lastName: '',
    email: '',
  }));
  const personName =
    buildProfileDisplayName({
      firstName: profile.firstName,
      lastName: profile.lastName,
    }) ?? profile.email;

  await exportEntriesToCsv(entries, tags, personName);
  return aggregatedExportDayCount(entries);
}
