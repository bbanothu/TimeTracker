import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { PageLoading } from '@/components/ui/PageLoading';
import { ActionButton } from '@/components/ui/ActionButton';
import { AddressSearchModal } from '@/components/ui/AddressSearchModal';
import { EditGeofenceModal } from '@/components/ui/EditGeofenceModal';
import { GeofenceMap, DEFAULT_CENTER } from '@/components/ui/GeofenceMap';
import { GeofencesList } from '@/components/ui/GeofencesList';
import { HeatmapMap } from '@/components/ui/HeatmapMap';
import { MapModeToggle, type MapViewMode } from '@/components/ui/MapModeToggle';
import { MapPeriodToolbar } from '@/components/ui/MapPeriodToolbar';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useSelectedTag } from '@/hooks/useSelectedTag';
import { notifyDataRefresh, subscribeDataRefresh } from '@/lib/dataRefresh';
import {
  createGeofence,
  deleteGeofence,
  fetchAllEntries,
  fetchGeofences,
  updateGeofence,
} from '@/services/data';
import type { Geofence, PeriodType, TimeEntry } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';
import { buildHeatmapSummary } from '@/utils/heatmapPoints';

function StepLabel({
  step,
  label,
  colors,
  className = 'mb-2',
}: {
  step: number;
  label: string;
  colors: ReturnType<typeof useAppColors>;
  className?: string;
}) {
  return (
    <p className={`text-sm font-semibold ${className}`} style={{ color: colors.textSecondary }}>
      {step}. {label}
    </p>
  );
}

function DropPinHeader({
  colors,
  onOpenAddressSearch,
}: {
  colors: ReturnType<typeof useAppColors>;
  onOpenAddressSearch: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <StepLabel step={2} label="Drop pin on map" colors={colors} className="mb-0" />
      <button
        type="button"
        onClick={onOpenAddressSearch}
        aria-label="Find address"
        className="rounded-full p-1 transition hover:opacity-70"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="1.5" />
          <path
            d="M12 8v8M8 12h8"
            stroke={colors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function MapPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { tags } = useTags();
  const { selectedTagId, setSelectedTagId } = useSelectedTag(tags);
  const [viewMode, setViewMode] = useState<MapViewMode>('places');
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('150');
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [heatmapPeriod, setHeatmapPeriod] = useState<PeriodType>('week');
  const [heatmapAnchorDate, setHeatmapAnchorDate] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const hasPin = draftLat != null && draftLng != null;
  const canSave = hasPin && !!selectedTagId && name.trim().length > 0 && !saving;

  const loadGeofences = useCallback(async () => {
    if (!user) return;
    setGeofences(await fetchGeofences(user.id));
    setLoading(false);
  }, [user]);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setEntriesLoading(true);
    try {
      setEntries(await fetchAllEntries(user.id));
    } finally {
      setEntriesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGeofences().catch(console.error);
  }, [loadGeofences]);

  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    loadEntries().catch(console.error);
  }, [viewMode, loadEntries]);

  useEffect(() => {
    if (!user) return;
    return subscribeDataRefresh(() => {
      loadGeofences().catch(console.error);
      if (viewMode === 'heatmap') {
        loadEntries().catch(console.error);
      }
    });
  }, [user, viewMode, loadGeofences, loadEntries]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        // Keep default center when permission is denied or unavailable.
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  const heatmapSummary = useMemo(
    () => buildHeatmapSummary(entries, geofences, heatmapAnchorDate, heatmapPeriod),
    [entries, geofences, heatmapAnchorDate, heatmapPeriod],
  );

  const handleMapClick = (latitude: number, longitude: number) => {
    setDraftLat(latitude);
    setDraftLng(longitude);
    setSaveMessage(null);
    setError(null);
  };

  const handleAddressSelect = (latitude: number, longitude: number) => {
    setDraftLat(latitude);
    setDraftLng(longitude);
    setMapCenter([latitude, longitude]);
    setSaveMessage(null);
    setError(null);
  };

  const handleSaveGeofence = async () => {
    if (!user || !canSave || draftLat == null || draftLng == null || !selectedTagId) return;

    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);
      await createGeofence(user.id, {
        tagId: selectedTagId,
        name: name.trim(),
        latitude: draftLat,
        longitude: draftLng,
        radiusMeters: Number(radius) || 150,
      });
      setName('');
      setDraftLat(null);
      setDraftLng(null);
      setSaveMessage('Place saved. Use the mobile app for arrival alerts and automatic tracking.');
      await loadGeofences();
      notifyDataRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save place');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (
    geofenceId: string,
    input: {
      tagId: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusMeters: number;
    },
  ) => {
    if (!user) return;
    await updateGeofence(user.id, geofenceId, input);
    await loadGeofences();
    notifyDataRefresh();
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <PageHeader title="Map" />

      <MapModeToggle mode={viewMode} onChange={setViewMode} />

      {viewMode === 'places' ? (
        <>
          <ThemedSurface className="mb-4 p-4 lg:mb-5">
            <p className="text-sm leading-6" style={{ color: colors.textOnBg }}>
              Drop a pin to save a place on web. Auto-tracking when you arrive still requires the
              iOS or Android app — saved places sync everywhere.
            </p>
          </ThemedSurface>

          <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <div className="space-y-4">
              <ThemedSurface className="p-4">
                <StepLabel step={1} label="Choose tag" colors={colors} />
                <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
                {tags.length === 0 ? (
                  <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                    Add tags on the Tags tab first.
                  </p>
                ) : null}
              </ThemedSurface>

              <ThemedSurface className="p-4 lg:hidden">
                <DropPinHeader
                  colors={colors}
                  onOpenAddressSearch={() => setAddressModalOpen(true)}
                />
                <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
                  Tap the map where you want tracking to start.
                </p>
                <GeofenceMap
                  geofences={geofences}
                  draftLat={draftLat}
                  draftLng={draftLng}
                  radiusMeters={Number(radius) || 150}
                  primaryColor={colors.primary}
                  disabledColor={colors.textDisabled}
                  center={mapCenter}
                  onMapClick={handleMapClick}
                  className="h-[260px]"
                />
              </ThemedSurface>

              <ThemedSurface className="p-4">
                <StepLabel step={3} label="Save place" colors={colors} />
                <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
                  Name the place and set how close you need to be before tracking starts on mobile.
                </p>

                <p className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Place name
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Office"
                  className="mb-3 w-full rounded-xl border px-4 py-2.5 text-base"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />

                <p className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Radius (meters)
                </p>
                <input
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="150"
                  inputMode="numeric"
                  className="mb-3 w-full rounded-xl border px-4 py-2.5 text-base"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />

                {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}
                {saveMessage ? (
                  <p className="mb-3 text-sm" style={{ color: colors.primary }}>
                    {saveMessage}
                  </p>
                ) : null}

                <ActionButton
                  label="Save place"
                  onClick={handleSaveGeofence}
                  disabled={!canSave}
                  loading={saving}
                  className="w-full"
                />
              </ThemedSurface>

              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
                  Saved places ({geofences.length})
                </p>
                <GeofencesList
                  geofences={geofences}
                  onEdit={setEditingGeofence}
                  onToggle={(geofence, enabled) =>
                    updateGeofence(user!.id, geofence.id, { enabled }).then(() => {
                      loadGeofences();
                      notifyDataRefresh();
                    })
                  }
                  onDelete={(geofence) =>
                    deleteGeofence(user!.id, geofence.id).then(() => {
                      loadGeofences();
                      notifyDataRefresh();
                    })
                  }
                />
              </div>
            </div>

            <ThemedSurface className="sticky top-8 hidden p-4 lg:block">
              <DropPinHeader
                colors={colors}
                onOpenAddressSearch={() => setAddressModalOpen(true)}
              />
              <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
                Click the map where you want tracking to start.
              </p>
              <GeofenceMap
                geofences={geofences}
                draftLat={draftLat}
                draftLng={draftLng}
                radiusMeters={Number(radius) || 150}
                primaryColor={colors.primary}
                disabledColor={colors.textDisabled}
                center={mapCenter}
                onMapClick={handleMapClick}
                className="h-[min(70vh,560px)]"
              />
            </ThemedSurface>
          </div>
        </>
      ) : (
        <>
          <ThemedSurface className="mb-4 p-4 lg:mb-5">
            <p className="text-sm leading-6" style={{ color: colors.textOnBg }}>
              See where you spend time from stop locations and saved places linked to sessions.
              Brighter areas mean more tracked time in that spot.
            </p>
          </ThemedSurface>

          <MapPeriodToolbar
            period={heatmapPeriod}
            anchorDate={heatmapAnchorDate}
            onPeriodChange={setHeatmapPeriod}
            onAnchorDateChange={setHeatmapAnchorDate}
          />

          {entriesLoading ? (
            <div className="mb-3 flex items-center gap-2">
              <LoadingIndicator size="small" />
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Loading sessions…
              </p>
            </div>
          ) : heatmapSummary.sessionCount > 0 ? (
            <p className="mb-3 text-sm font-medium" style={{ color: colors.textMuted }}>
              {heatmapSummary.sessionCount} session{heatmapSummary.sessionCount === 1 ? '' : 's'} ·{' '}
              {formatDurationLong(heatmapSummary.totalDurationMs)} tracked in this period
            </p>
          ) : (
            <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
              No locations in this period. Points appear from stop GPS or sessions linked to saved
              places.
            </p>
          )}

          <ThemedSurface className="sticky top-8 p-4">
            <HeatmapMap
              points={heatmapSummary.points}
              center={mapCenter}
              className="h-[min(70vh,560px)]"
            />
          </ThemedSurface>
        </>
      )}

      <AddressSearchModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelect={handleAddressSelect}
      />

      <EditGeofenceModal
        visible={editingGeofence != null}
        geofence={editingGeofence}
        geofences={geofences}
        tags={tags}
        onClose={() => setEditingGeofence(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
