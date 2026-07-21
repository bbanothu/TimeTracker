import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, type MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';

import { ActionButton } from '@/components/ActionButton';
import { AddressSearchModal } from '@/components/AddressSearchModal';
import { AutoTrackingBanner } from '@/components/AutoTrackingBanner';
import { EditGeofenceModal } from '@/components/EditGeofenceModal';
import { GeofencesList } from '@/components/GeofencesList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagDropdown } from '@/components/TagDropdown';
import { ThemedSurface } from '@/components/ThemedSurface';
import { createGeofence, deleteGeofence, getAllGeofences, updateGeofence } from '@/db/client';
import { filterDisplayGeofences } from '@/constants/defaultPlace';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useGeofenceMonitoring } from '@/hooks/useGeofenceMonitoring';
import { useSelectedTag } from '@/hooks/useSelectedTag';
import { useTags } from '@/hooks/useTags';
import {
  requestBackgroundPermissions,
  requestLocationPermissions,
  syncGeofencingTask,
} from '@/services/geofenceService';
import { requestNotificationPermissions } from '@/services/notificationService';
import { pushChangesInBackground } from '@/services/syncScheduler';
import type { Geofence } from '@/types';

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

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
    <Text className={`text-sm font-semibold ${className}`} style={{ color: colors.textSecondary }}>
      {step}. {label}
    </Text>
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
    <View className="mb-2 flex-row items-center justify-between">
      <StepLabel step={2} label="Drop pin on map" colors={colors} className="mb-0" />
      <Pressable
        onPress={onOpenAddressSearch}
        accessibilityLabel="Find address"
        className="rounded-full p-1"
      >
        <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export default function MapScreen() {
  const { tags } = useTags();
  const { selectedTagId, setSelectedTagId } = useSelectedTag(tags);
  const colors = useAppColors();
  const { user } = useAuth();
  const { ready, refresh } = useActiveSession();
  const { refreshStatus } = useGeofenceMonitoring();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('150');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [saving, setSaving] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const hasPin = draftLat != null && draftLng != null;
  const canSave = hasPin && !!selectedTagId && name.trim().length > 0 && !saving;
  const displayGeofences = useMemo(() => filterDisplayGeofences(geofences), [geofences]);

  const loadGeofences = useCallback(() => {
    setGeofences(getAllGeofences());
  }, []);

  const refreshMapData = useCallback(() => {
    if (!ready) return;
    loadGeofences();
  }, [ready, loadGeofences]);

  useEffect(() => {
    if (!ready) return;
    loadGeofences();
  }, [ready, loadGeofences]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const granted = await requestLocationPermissions();
      if (!granted || cancelled) return;

      const location = await Location.getCurrentPositionAsync({});
      if (cancelled) return;

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMapPress = (event: MapPressEvent) => {
    setDraftLat(event.nativeEvent.coordinate.latitude);
    setDraftLng(event.nativeEvent.coordinate.longitude);
  };

  const handleAddressSelect = (latitude: number, longitude: number) => {
    setDraftLat(latitude);
    setDraftLng(longitude);
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    });
  };

  const handleSaveGeofence = async () => {
    if (!canSave || draftLat == null || draftLng == null || !selectedTagId) return;

    try {
      setSaving(true);

      const notificationsGranted = await requestNotificationPermissions();
      if (!notificationsGranted) {
        Alert.alert(
          'Notifications recommended',
          'Allow notifications so you can stop tracking from an alert if a visit is detected incorrectly.',
        );
      }

      createGeofence({
        tagId: selectedTagId,
        name: name.trim(),
        latitude: draftLat,
        longitude: draftLng,
        radiusMeters: Number(radius) || 150,
      });

      setName('');
      setDraftLat(null);
      setDraftLng(null);
      loadGeofences();
      pushChangesInBackground(user?.id);

      const backgroundGranted = await requestBackgroundPermissions();
      if (backgroundGranted) {
        await syncGeofencingTask();
        Alert.alert(
          'Place saved',
          "You'll get a notification when you arrive. Tracking starts automatically — tap Stop if it's wrong.",
        );
      } else {
        Alert.alert(
          'Place saved',
          'Enable Always Allow location for automatic tracking when the app is closed.',
        );
      }
      await refreshStatus();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (geofence: Geofence, enabled: boolean) => {
    updateGeofence(geofence.id, { enabled });
    loadGeofences();
    await syncGeofencingTask();
    await refreshStatus();
    pushChangesInBackground(user?.id);
  };

  const handleDelete = async (geofence: Geofence) => {
    deleteGeofence(geofence.id);
    loadGeofences();
    await syncGeofencingTask();
    await refreshStatus();
    pushChangesInBackground(user?.id);
  };

  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
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
    updateGeofence(geofenceId, input);
    loadGeofences();
    await syncGeofencingTask();
    await refreshStatus();
    pushChangesInBackground(user?.id);
  };

  const setupHeader = (
    <>
      <AutoTrackingBanner className="mx-0" />

      <ThemedSurface className="mx-4 mt-3 p-4">
        <Text className="mb-3 text-sm" style={{ color: colors.textMuted }}>
          Link a tag to a place. When you arrive, tracking starts automatically and you get a
          notification with a Stop button if it is wrong.
        </Text>

        <StepLabel step={1} label="Choose tag" colors={colors} />
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
        {tags.length === 0 ? (
          <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>
            Add tags on the Tags tab first.
          </Text>
        ) : null}
      </ThemedSurface>

      <ThemedSurface className="mx-4 mt-3 overflow-hidden p-4">
        <DropPinHeader
          colors={colors}
          onOpenAddressSearch={() => {
            Keyboard.dismiss();
            setAddressModalOpen(true);
          }}
        />
        <Text className="mb-3 text-sm" style={{ color: colors.textMuted }}>
          Tap the map where you want tracking to start.
        </Text>
        <View
          className="overflow-hidden rounded-xl"
          style={{ height: 260, backgroundColor: colors.secondaryBg }}
        >
          <MapView
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {hasPin ? (
              <>
                <Marker
                  coordinate={{ latitude: draftLat!, longitude: draftLng! }}
                  title="New place"
                />
                <Circle
                  center={{ latitude: draftLat!, longitude: draftLng! }}
                  radius={Number(radius) || 150}
                  strokeColor={colors.primary}
                  fillColor={`${colors.primary}26`}
                />
              </>
            ) : null}

            {displayGeofences.map((geofence) => (
              <Circle
                key={geofence.id}
                center={{ latitude: geofence.latitude, longitude: geofence.longitude }}
                radius={geofence.radiusMeters}
                strokeColor={geofence.enabled ? (geofence.tag?.color ?? colors.primary) : '#94A3B8'}
                fillColor={`${geofence.tag?.color ?? colors.primary}33`}
              />
            ))}
          </MapView>
        </View>
      </ThemedSurface>

      <ThemedSurface className="mx-4 mt-3 p-4">
        <StepLabel step={3} label="Save place" colors={colors} />
        <Text className="mb-3 text-sm" style={{ color: colors.textMuted }}>
          Name the place and set how close you need to be before tracking starts.
        </Text>

        <Text className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
          Place name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Office"
          placeholderTextColor={colors.inputPlaceholder}
          className="mb-1 rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
        <Text className="mb-3 text-xs" style={{ color: colors.textMuted }}>
          Shown in notifications, stats, and your saved places list.
        </Text>

        <Text className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
          Radius (meters)
        </Text>
        <TextInput
          value={radius}
          onChangeText={setRadius}
          placeholder="150"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="number-pad"
          className="mb-1 rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
        <Text className="mb-4 text-xs" style={{ color: colors.textMuted }}>
          The circle on the map shows this area. Larger values start tracking farther from the pin.
        </Text>

        <ActionButton
          label="Save place"
          onPress={handleSaveGeofence}
          disabled={!canSave}
          loading={saving}
        />
      </ThemedSurface>

      <Text
        className="mx-4 mb-2 mt-1 px-1 text-[13px] font-semibold uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        Saved places ({displayGeofences.length})
      </Text>
      <View className="mx-4 mb-6">
        <GeofencesList
          geofences={displayGeofences}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </View>
    </>
  );

  return (
    <TabScreenContainer>
      <TabScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        contentPad={false}
        scrollEnabled={!addressModalOpen}
        keyboardShouldPersistTaps="handled"
        onRefreshExtra={refreshMapData}
      >
        {setupHeader}
      </TabScrollView>

      <AddressSearchModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelect={handleAddressSelect}
      />

      <EditGeofenceModal
        visible={editingGeofence != null}
        geofence={editingGeofence}
        tags={tags}
        onClose={() => setEditingGeofence(null)}
        onSave={handleSaveEdit}
      />
    </TabScreenContainer>
  );
}
