import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, type MapPressEvent } from 'react-native-maps';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal, BottomSheetScrollView } from '@/components/BottomSheetModal';
import { TagDropdown } from '@/components/TagDropdown';
import { useAppColors } from '@/hooks/useAppColors';
import type { Geofence, Tag } from '@/types';

interface EditGeofenceModalProps {
  visible: boolean;
  geofence: Geofence | null;
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
  ) => void;
}

export function EditGeofenceModal({
  visible,
  geofence,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !geofence) return;
    setName(geofence.name);
    setRadius(String(geofence.radiusMeters));
    setSelectedTagId(geofence.tagId);
    setLatitude(geofence.latitude);
    setLongitude(geofence.longitude);
    setError(null);
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

  const mapRegion = useMemo(() => {
    const lat = latitude ?? geofence?.latitude ?? 0;
    const lng = longitude ?? geofence?.longitude ?? 0;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [latitude, longitude, geofence]);

  const radiusMeters = Number(radius) || 150;
  const canSave =
    !!geofence &&
    !!selectedTagId &&
    name.trim().length > 0 &&
    latitude != null &&
    longitude != null;

  const handleMapPress = (event: MapPressEvent) => {
    setLatitude(event.nativeEvent.coordinate.latitude);
    setLongitude(event.nativeEvent.coordinate.longitude);
  };

  const handleSave = () => {
    if (!geofence || !selectedTagId || latitude == null || longitude == null) return;

    try {
      setError(null);
      if (name.trim().length === 0) {
        setError('Enter a place name.');
        return;
      }
      if (radiusMeters < 25 || radiusMeters > 5000) {
        setError('Radius must be between 25 and 5000 meters.');
        return;
      }

      onSave(geofence.id, {
        tagId: selectedTagId,
        name: name.trim(),
        latitude,
        longitude,
        radiusMeters,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save place');
    }
  };

  const selectedTag = tags.find((tag) => tag.id === selectedTagId);
  const pinColor = selectedTag?.color ?? colors.primary;

  return (
    <BottomSheetModal
      visible={visible}
      title="Edit place"
      onClose={onClose}
      maxHeightFraction={0.92}
    >
      <BottomSheetScrollView maxHeightFraction={0.78} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          Activity
        </Text>
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

        <Text className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          Place name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Office"
          placeholderTextColor={colors.inputPlaceholder}
          className="rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />

        <Text className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          Location
        </Text>
        <Text className="mb-2 text-xs" style={{ color: colors.textMuted }}>
          Tap the map to move the pin.
        </Text>
        <View
          className="mb-4 overflow-hidden rounded-xl"
          style={{ height: 200, backgroundColor: colors.secondaryBg }}
        >
          {latitude != null && longitude != null ? (
            <MapView style={{ flex: 1 }} region={mapRegion} onPress={handleMapPress}>
              <Marker coordinate={{ latitude, longitude }} title={name.trim() || 'Place'} />
              <Circle
                center={{ latitude, longitude }}
                radius={radiusMeters}
                strokeColor={pinColor}
                fillColor={`${pinColor}26`}
              />
            </MapView>
          ) : null}
        </View>

        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          Radius (meters)
        </Text>
        <TextInput
          value={radius}
          onChangeText={setRadius}
          placeholder="150"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="number-pad"
          className="rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />

        {error ? (
          <Text className="mt-3 text-sm" style={{ color: colors.destructiveText }}>
            {error}
          </Text>
        ) : null}

        <ActionButton
          label="Save changes"
          onPress={handleSave}
          disabled={!canSave}
          className="mt-4"
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
