import {
  getActiveSession,
  getTodayEntries,
  startSession,
  stopSession,
} from '@/db/client';
import type { ActiveSession, EntrySource, TimeEntry } from '@/types';

export const timerService = {
  getActiveSession,
  getTodayEntries,

  startManual(tagIds: string[]): ActiveSession {
    if (tagIds.length === 0) {
      throw new Error('Select at least one tag');
    }
    return startSession(tagIds, 'manual');
  },

  startGeofence(tagId: string, geofenceId: string): ActiveSession {
    return startSession([tagId], 'geofence', geofenceId);
  },

  stop(): TimeEntry | null {
    return stopSession();
  },
};

export type { EntrySource };
