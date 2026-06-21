import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getCurrentUserId } from '@/db/client';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { pushChangesInBackground } from '@/services/syncScheduler';
import { timerService } from '@/services/timerService';
import { formatTagName } from '@/utils/formatDuration';

export const GEOFENCE_STOP_ACTION = 'stop-tracking';
export const GEOFENCE_CATEGORY = 'geofence-enter';
const GEOFENCE_CHANNEL_ID = 'geofence';

let categoriesReady = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function notificationIdForGeofence(geofenceId: string): string {
  return `geofence-${geofenceId}`;
}

export async function setupNotifications(): Promise<void> {
  if (categoriesReady) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(GEOFENCE_CHANNEL_ID, {
      name: 'Location tracking',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  await Notifications.setNotificationCategoryAsync(GEOFENCE_CATEGORY, [
    {
      identifier: GEOFENCE_STOP_ACTION,
      buttonTitle: 'Stop tracking',
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

function handleStopTracking(geofenceId?: string): void {
  try {
    const session = geofenceId ? timerService.getActiveSessionByGeofenceId(geofenceId) : null;
    if (!session) return;

    timerService.stop(session.id);
    notifyDataRefresh();
    pushChangesInBackground(getCurrentUserId());
    if (geofenceId) {
      dismissGeofenceNotification(geofenceId).catch(console.warn);
    }
  } catch (error) {
    console.warn('Failed to stop tracking from notification:', error);
  }
}

export function registerNotificationResponseHandler(
  navigateToTrack?: () => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const geofenceId = response.notification.request.content.data?.geofenceId as
      | string
      | undefined;

    if (response.actionIdentifier === GEOFENCE_STOP_ACTION) {
      handleStopTracking(geofenceId);
      return;
    }

    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      navigateToTrack?.();
    }
  });

  return () => subscription.remove();
}
