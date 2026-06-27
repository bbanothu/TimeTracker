import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { GEOFENCE_TASK, handleGeofenceEnter, handleGeofenceExit } from '@/services/geofenceService';

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
    } else if (eventType === Location.GeofencingEventType.Exit) {
      await handleGeofenceExit(region.identifier);
    }
  } catch (taskError) {
    console.warn('Geofence task handler failed:', taskError);
  }
});
