import {
  createManualEntry,
  getActiveSession,
  getActiveSessionByGeofenceId,
  getActiveSessions,
  getTodayEntries,
  setSessionAlarmAt,
  startSession,
  stopSession,
  type StopSessionOptions,
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

  startAlarm(tagIds: string[], alarmAt: number): ActiveSession {
    if (tagIds.length === 0) {
      throw new Error('Select at least one tag');
    }
    return startSession(tagIds, 'manual', null, alarmAt);
  },

  extendAlarm(sessionId: string, alarmAt: number): ActiveSession {
    return setSessionAlarmAt(sessionId, alarmAt);
  },

  startGeofence(tagId: string, geofenceId: string): ActiveSession {
    return startSession([tagId], 'geofence', geofenceId);
  },

  stop(sessionId: string, options?: StopSessionOptions): TimeEntry | null {
    return stopSession(sessionId, options);
  },

  addManualEntry(tagIds: string[], startedAt: number, endedAt: number): TimeEntry {
    return createManualEntry(tagIds, startedAt, endedAt);
  },
};

export type { EntrySource };
