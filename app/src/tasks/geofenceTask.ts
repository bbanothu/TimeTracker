import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import {
  ensureUnknownLocationSession,
  GEOFENCE_TASK,
  handleGeofenceEnter,
  handleGeofenceExit,
  reconcileUnknownSession,
} from '@/services/geofenceService';

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error.message);
    return;
  }

  try {
    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };

    if (!region.identifier) return;

    if (eventType === Location.GeofencingEventType.Enter) {
      await handleGeofenceEnter(region.identifier);
      await ensureUnknownLocationSession(true);
    } else if (eventType === Location.GeofencingEventType.Exit) {
      await handleGeofenceExit(region.identifier);
      await reconcileUnknownSession();
    }
  } catch (taskError) {
    console.warn('Geofence task handler failed:', taskError);
  }
});
