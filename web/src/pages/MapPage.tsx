import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
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
      <PageHeader title="Map" />

      <div className="lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <ThemedSurface className="mb-4 p-4 lg:mb-0 lg:sticky lg:top-8">
          <h2 className="mb-2 text-base font-semibold" style={{ color: colors.text }}>
            Location tracking is mobile-only
          </h2>
          <p className="text-sm leading-6" style={{ color: colors.textMuted }}>
            Link tags to places and get arrival alerts on the iOS or Android app. Saved places sync
            here so you can review or disable them on web.
          </p>
        </ThemedSurface>

        <div>
          <p className="mb-2 text-sm font-medium lg:text-base" style={{ color: colors.textMuted }}>
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
      </div>
    </div>
  );
}
