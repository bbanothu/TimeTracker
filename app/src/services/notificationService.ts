import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getCurrentUserId } from '@/db/client';
import { getStopCoordinates } from '@/lib/stopLocation';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { timerService } from '@/services/timerService';
import { formatTagName } from '@/utils/formatDuration';

export const GEOFENCE_STOP_ACTION = 'stop-tracking';
export const GEOFENCE_CATEGORY = 'geofence-enter';
const GEOFENCE_CHANNEL_ID = 'geofence';

export const ALARM_FINISH_ACTION = 'alarm-finish';
export const ALARM_EXTEND_15_ACTION = 'alarm-extend-15';
export const ALARM_CATEGORY = 'session-alarm';
const ALARM_CHANNEL_ID = 'session-alarm';

export const ALARM_EXTEND_PRESETS_MS = [15 * 60 * 1000, 30 * 60 * 1000] as const;

let categoriesReady = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function notificationIdForGeofence(geofenceId: string): string {
  return `geofence-${geofenceId}`;
}

function notificationIdForAlarm(sessionId: string): string {
  return `session-alarm-${sessionId}`;
}

export async function setupNotifications(): Promise<void> {
  if (categoriesReady) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(GEOFENCE_CHANNEL_ID, {
      name: 'Location tracking',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Session alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
    });
  }

  await Notifications.setNotificationCategoryAsync(GEOFENCE_CATEGORY, [
    {
      identifier: GEOFENCE_STOP_ACTION,
      buttonTitle: 'Stop tracking',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY, [
    {
      identifier: ALARM_EXTEND_15_ACTION,
      buttonTitle: '+15 min',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ALARM_FINISH_ACTION,
      buttonTitle: 'Finish',
      options: { opensAppToForeground: true },
    },
  ]);

  categoriesReady = true;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  await setupNotifications();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function showGeofenceEnterNotification(
  geofenceId: string,
  placeName: string,
  tagName: string,
): Promise<void> {
  await setupNotifications();

  const tagLabel = formatTagName(tagName);

  await Notifications.scheduleNotificationAsync({
    identifier: notificationIdForGeofence(geofenceId),
    content: {
      title: `Tracking ${tagLabel} at ${placeName}`,
      body: 'Tracking started automatically. Tap Stop if this is wrong.',
      categoryIdentifier: GEOFENCE_CATEGORY,
      data: { geofenceId, type: 'geofence-enter' },
      ...(Platform.OS === 'android' ? { channelId: GEOFENCE_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

export async function dismissGeofenceNotification(geofenceId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationIdForGeofence(geofenceId));
  } catch {
    // Notification may already be dismissed.
  }
}

export async function cancelSessionAlarmNotification(sessionId: string): Promise<void> {
  const id = notificationIdForAlarm(sessionId);
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // May not be scheduled.
  }
  try {
    await Notifications.dismissNotificationAsync(id);
  } catch {
    // May already be dismissed.
  }
}

export async function scheduleSessionAlarmNotification(
  sessionId: string,
  alarmAt: number,
  tagLabel: string,
): Promise<void> {
  await setupNotifications();
  const granted = await requestNotificationPermissions();
  if (!granted) {
    throw new Error('Notification permission is required for session alarms');
  }

  await cancelSessionAlarmNotification(sessionId);

  const seconds = Math.max(1, Math.ceil((alarmAt - Date.now()) / 1000));

  await Notifications.scheduleNotificationAsync({
    identifier: notificationIdForAlarm(sessionId),
    content: {
      title: `${tagLabel} alarm`,
      body: 'Time is up. Finish to log, or extend +15 min.',
      categoryIdentifier: ALARM_CATEGORY,
      sound: 'default',
      data: { sessionId, type: 'session-alarm' },
      ...(Platform.OS === 'android' ? { channelId: ALARM_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

/** Reschedule alarms for all active sessions that still have a future alarmAt. */
export async function rescheduleActiveSessionAlarms(): Promise<void> {
  await setupNotifications();
  const sessions = timerService.getActiveSessions();
  for (const session of sessions) {
    if (session.alarmAt == null) continue;
    const tagLabel = session.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session';
    if (session.alarmAt <= Date.now()) {
      // Already due — fire immediately so overdue state is visible.
      await Notifications.scheduleNotificationAsync({
        identifier: notificationIdForAlarm(session.id),
        content: {
          title: `${tagLabel} alarm overdue`,
          body: 'Session is still running. Finish or extend.',
          categoryIdentifier: ALARM_CATEGORY,
          sound: 'default',
          data: { sessionId: session.id, type: 'session-alarm' },
          ...(Platform.OS === 'android' ? { channelId: ALARM_CHANNEL_ID } : {}),
        },
        trigger: null,
      });
      continue;
    }
    try {
      await scheduleSessionAlarmNotification(session.id, session.alarmAt, tagLabel);
    } catch (error) {
      console.warn('Failed to reschedule session alarm:', error);
    }
  }
}

async function handleStopTracking(geofenceId?: string): Promise<void> {
  try {
    const session = geofenceId ? timerService.getActiveSessionByGeofenceId(geofenceId) : null;
    if (!session) return;

    const coords = await getStopCoordinates();
    timerService.stop(session.id, {
      stopLatitude: coords?.latitude ?? null,
      stopLongitude: coords?.longitude ?? null,
    });
    notifyDataRefresh();
    pushChangesInBackground(getCurrentUserId());
    if (geofenceId) {
      dismissGeofenceNotification(geofenceId).catch(console.warn);
    }
  } catch (error) {
    console.warn('Failed to stop tracking from notification:', error);
  }
}

async function handleAlarmFinish(sessionId?: string): Promise<void> {
  if (!sessionId) return;
  try {
    const session = timerService.getActiveSessions().find((item) => item.id === sessionId);
    if (!session) return;

    await cancelSessionAlarmNotification(sessionId);
    const coords = await getStopCoordinates();
    timerService.stop(sessionId, {
      stopLatitude: coords?.latitude ?? null,
      stopLongitude: coords?.longitude ?? null,
    });
    notifyDataRefresh();
    pushChangesInBackground(getCurrentUserId());
  } catch (error) {
    console.warn('Failed to finish alarm session from notification:', error);
  }
}

async function handleAlarmExtend15(sessionId?: string): Promise<void> {
  if (!sessionId) return;
  try {
    const session = timerService.getActiveSessions().find((item) => item.id === sessionId);
    if (!session) return;

    const alarmAt = Date.now() + ALARM_EXTEND_PRESETS_MS[0];
    timerService.extendAlarm(sessionId, alarmAt);
    const tagLabel = session.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session';
    await scheduleSessionAlarmNotification(sessionId, alarmAt, tagLabel);
    notifyDataRefresh();
  } catch (error) {
    console.warn('Failed to extend alarm from notification:', error);
  }
}

export function registerNotificationResponseHandler(navigateToTrack?: () => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    const geofenceId = data.geofenceId as string | undefined;
    const sessionId = data.sessionId as string | undefined;

    if (response.actionIdentifier === GEOFENCE_STOP_ACTION) {
      handleStopTracking(geofenceId).catch(console.warn);
      return;
    }

    if (response.actionIdentifier === ALARM_FINISH_ACTION) {
      handleAlarmFinish(sessionId).catch(console.warn);
      navigateToTrack?.();
      return;
    }

    if (response.actionIdentifier === ALARM_EXTEND_15_ACTION) {
      handleAlarmExtend15(sessionId).catch(console.warn);
      return;
    }

    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      navigateToTrack?.();
    }
  });

  return () => subscription.remove();
}
