import {
  getActiveSession,
  getActiveSessionByGeofenceId,
  getActiveSessions,
  getTodayEntries,
  startSession,
  stopSession,
} from '@/db/client';
import type { ActiveSession, EntrySource, TimeEntry } from '@/types';

export const timerService = {
  getActiveSessions,
  getActiveSession,
  getActiveSessionByGeofenceId,
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

  stop(sessionId: string): TimeEntry | null {
    return stopSession(sessionId);
  },
};

export type { EntrySource };
