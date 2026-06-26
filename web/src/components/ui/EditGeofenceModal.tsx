import { useEffect, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { GeofenceMap, DEFAULT_CENTER } from '@/components/ui/GeofenceMap';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Geofence, Tag } from '@/types';

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

  return (
    <BottomSheetModal visible={visible} title="Edit place" onClose={onClose} maxHeightFraction={0.92}>
      <BottomSheetScroll maxHeightFraction={0.78}>
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
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />

        <p className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
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
            className="mb-4 h-[200px]"
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
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />

        {error ? (
          <p className="mt-3 text-sm" style={{ color: colors.destructiveText }}>
            {error}
          </p>
        ) : null}

        <ActionButton
          label="Save changes"
          onClick={handleSave}
          disabled={!canSave}
          loading={saving}
          className="mt-4 w-full"
        />
      </BottomSheetScroll>
    </BottomSheetModal>
  );
}
