import { useEffect, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { GeofenceMap, DEFAULT_CENTER } from '@/components/ui/GeofenceMap';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Geofence, Tag } from '@/types';

function SaveIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface EditGeofenceModalProps {
  visible: boolean;
  geofence: Geofence | null;
  geofences: Geofence[];
  tags: Tag[];
  onClose: () => void;
  onSave: (
    geofenceId: string,
    input: {
      tagId: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusMeters: number;
    },
  ) => Promise<void>;
}

export function EditGeofenceModal({
  visible,
  geofence,
  geofences,
  tags,
  onClose,
  onSave,
}: EditGeofenceModalProps) {
  const colors = useAppColors();
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('150');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !geofence) return;
    setName(geofence.name);
    setRadius(String(geofence.radiusMeters));
    setSelectedTagId(geofence.tagId);
    setLatitude(geofence.latitude);
    setLongitude(geofence.longitude);
    setMapCenter([geofence.latitude, geofence.longitude]);
    setError(null);
    setSaving(false);
  }, [visible, geofence]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  const otherGeofences = useMemo(
    () => (geofence ? geofences.filter((item) => item.id !== geofence.id) : geofences),
    [geofence, geofences],
  );

  const radiusMeters = Number(radius) || 150;
  const canSave =
    !!geofence &&
    !!selectedTagId &&
    name.trim().length > 0 &&
    latitude != null &&
    longitude != null &&
    !saving;

  const handleSave = async () => {
    if (!geofence || !selectedTagId || latitude == null || longitude == null) return;

    if (name.trim().length === 0) {
      setError('Enter a place name.');
      return;
    }
    if (radiusMeters < 25 || radiusMeters > 5000) {
      setError('Radius must be between 25 and 5000 meters.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(geofence.id, {
        tagId: selectedTagId,
        name: name.trim(),
        latitude,
        longitude,
        radiusMeters,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save place');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const headerSaveButton = (
    <button
      type="button"
      onClick={() => {
        handleSave().catch(console.error);
      }}
      disabled={!canSave}
      aria-label="Save changes"
      title="Save"
      className="rounded-full p-1 transition hover:opacity-80 disabled:opacity-50 lg:hidden"
    >
      {saving ? (
        <span
          className="inline-block h-[22px] w-[22px] animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
        />
      ) : (
        <SaveIcon color={colors.primary} />
      )}
    </button>
  );

  return (
    <BottomSheetModal
      visible={visible}
      title="Edit place"
      onClose={onClose}
      headerActions={headerSaveButton}
      maxHeightFraction={0.8}
      panelClassName="sm:w-[80vw] sm:max-w-[80vw]"
    >
      <BottomSheetScroll maxHeightFraction={0.72} heightCapRem={null}>
        <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
              Activity
            </p>
            <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

            <p className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
              Place name
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Office"
              className="w-full rounded-xl border px-4 py-2.5 text-base"
              style={inputStyle}
            />

            <ActionButton
              label="Save changes"
              onClick={handleSave}
              disabled={!canSave}
              loading={saving}
              className="mt-4 hidden w-full lg:block"
            />

            {error ? (
              <p className="mt-3 hidden text-sm lg:block" style={{ color: colors.destructiveText }}>
                {error}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="mb-2 mt-4 text-sm font-medium lg:mt-0" style={{ color: colors.textMuted }}>
              Location
            </p>
            <p className="mb-2 text-xs" style={{ color: colors.textMuted }}>
              Click the map to move the pin.
            </p>
            {latitude != null && longitude != null ? (
              <GeofenceMap
                geofences={otherGeofences}
                draftLat={latitude}
                draftLng={longitude}
                radiusMeters={radiusMeters}
                primaryColor={colors.primary}
                disabledColor={colors.textDisabled}
                center={mapCenter}
                onMapClick={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                className="mb-4 h-[200px] lg:h-[min(42vh,420px)]"
              />
            ) : null}

            <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
              Radius (meters)
            </p>
            <input
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="150"
              inputMode="numeric"
              className="w-full rounded-xl border px-4 py-2.5 text-base"
              style={inputStyle}
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm lg:hidden" style={{ color: colors.destructiveText }}>
            {error}
          </p>
        ) : null}
      </BottomSheetScroll>
    </BottomSheetModal>
  );
}
