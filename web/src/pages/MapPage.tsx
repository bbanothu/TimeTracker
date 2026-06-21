import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { deleteGeofence, fetchGeofences, updateGeofence } from '@/services/data';
import type { Geofence } from '@/types';
import { formatTagName } from '@/utils/formatDuration';

export function MapPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setGeofences(await fetchGeofences(user.id));
    setLoading(false);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [user]);

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

      <h2 className="mb-3 text-lg font-semibold" style={{ color: colors.textOnBg }}>
        Saved places
      </h2>

      {geofences.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No saved places yet.</p>
      ) : (
        <div className="space-y-3">
          {geofences.map((item) => (
            <ThemedSurface key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: colors.text }}>
                    {item.name}
                  </p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {formatTagName(item.tag?.name ?? 'tag')} · {item.radiusMeters}m
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) =>
                      updateGeofence(user!.id, item.id, { enabled: e.target.checked }).then(load)
                    }
                  />
                  Enabled
                </label>
              </div>
              <ActionButton
                label="Delete"
                variant="destructiveOutline"
                className="mt-3"
                onClick={() => deleteGeofence(user!.id, item.id).then(load)}
              />
            </ThemedSurface>
          ))}
        </div>
      )}
    </div>
  );
}
