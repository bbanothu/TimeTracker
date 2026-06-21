import { useCallback, useEffect, useState } from 'react';

import { GeofencesList } from '@/components/ui/GeofencesList';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { deleteGeofence, fetchGeofences, updateGeofence } from '@/services/data';
import type { Geofence } from '@/types';

export function MapPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setGeofences(await fetchGeofences(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      load().catch(console.error);
    });
  }, [user, load]);

  if (loading) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Map
      </h1>

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-2 text-base font-semibold" style={{ color: colors.text }}>
          Location tracking is mobile-only
        </h2>
        <p className="text-sm leading-6" style={{ color: colors.textMuted }}>
          Link tags to places and get arrival alerts on the iOS or Android app. Saved places sync
          here so you can review or disable them on web.
        </p>
      </ThemedSurface>

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Saved places ({geofences.length})
      </p>
      <GeofencesList
        geofences={geofences}
        onToggle={(geofence, enabled) =>
          updateGeofence(user!.id, geofence.id, { enabled }).then(load)
        }
        onDelete={(geofence) => deleteGeofence(user!.id, geofence.id).then(load)}
      />
    </div>
  );
}
