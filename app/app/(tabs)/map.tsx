import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Circle, Marker, type MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';

import { ActionButton } from '@/components/ActionButton';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { ThemedSurface } from '@/components/ThemedSurface';
import {
  createGeofence,
  deleteGeofence,
  getAllGeofences,
  updateGeofence,
} from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';
import {
  geofenceService,
  requestBackgroundPermissions,
  requestLocationPermissions,
  syncGeofencingTask,
} from '@/services/geofenceService';
import { requestNotificationPermissions } from '@/services/notificationService';
import { syncService } from '@/services/syncService';
import { formatTagName } from '@/utils/formatDuration';
import { flattenTags } from '@/utils/tagTree';
import type { Geofence } from '@/types';

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

function StepLabel({ step, label, colors }: { step: number; label: string; colors: ReturnType<typeof useAppColors> }) {
  return (
    <Text className="mb-2 text-sm font-semibold" style={{ color: colors.textSecondary }}>
      {step}. {label}
    </Text>
  );
}

export default function MapScreen() {
  const { tags } = useTags();
  const colors = useAppColors();
  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const { user } = useAuth();
  const { ready, refresh } = useActiveSession();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('150');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [showBanner, setShowBanner] = useState(true);
  const [saving, setSaving] = useState(false);
  const insideIdsRef = useRef<Set<string>>(new Set());

  const hasPin = draftLat != null && draftLng != null;
  const canSave = hasPin && !!selectedTagId && name.trim().length > 0 && !saving;

  const loadGeofences = useCallback(() => {
    setGeofences(getAllGeofences());
  }, []);

  const pushSync = useCallback(async () => {
    if (user) {
      await syncService.push(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    loadGeofences();
    if (tags.length > 0 && !selectedTagId) {
      setSelectedTagId(tags[0].id);
    }
  }, [ready, loadGeofences, tags, selectedTagId]);

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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const granted = await requestLocationPermissions();
        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({});
        insideIdsRef.current = await geofenceService.checkForegroundGeofences(
          location.coords.latitude,
          location.coords.longitude,
          insideIdsRef.current,
        );
        refresh();
      } catch (error) {
        console.warn('Foreground geofence check failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  const handleMapPress = (event: MapPressEvent) => {
    setDraftLat(event.nativeEvent.coordinate.latitude);
    setDraftLng(event.nativeEvent.coordinate.longitude);
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
      await syncGeofencingTask();
      await pushSync();

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
          'Enable Always Allow location in Settings for automatic tracking when the app is closed.',
        );
      }
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
    await pushSync();
  };

  const handleDelete = async (geofence: Geofence) => {
    Alert.alert('Delete geofence', `Remove ${geofence.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deleteGeofence(geofence.id);
          loadGeofences();
          await syncGeofencingTask();
          await pushSync();
        },
      },
    ]);
  };

  const setupHeader = (
    <>
      {showBanner ? (
        <View className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <Text className="text-sm text-amber-900 dark:text-amber-200">
            Expo Go has limited background location and notifications. Use a development build for
            reliable arrival alerts and auto-tracking.
          </Text>
          <Pressable onPress={() => setShowBanner(false)} className="mt-2">
            <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Dismiss
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ThemedSurface className="mx-4 mt-3 p-4">
        <Text className="mb-3 text-sm" style={{ color: colors.textMuted }}>
          Link a tag to a place. When you arrive, tracking starts automatically and you get a
          notification with a Stop button if it is wrong.
        </Text>

        <StepLabel step={1} label="Choose tag" colors={colors} />
        <View className="flex-row flex-wrap">
          {flatTags.length === 0 ? (
            <Text className="text-sm" style={{ color: colors.textMuted }}>
              Add tags on the Tags tab first.
            </Text>
          ) : (
            flatTags.map((item) => {
              const selected = selectedTagId === item.tag.id;
              return (
                <Pressable
                  key={item.tag.id}
                  onPress={() => setSelectedTagId(item.tag.id)}
                  className="mr-2 mb-2 rounded-full px-3 py-2"
                  style={{
                    backgroundColor: selected ? colors.primary : colors.secondaryBg,
                  }}
                >
                  <Text style={{ color: selected ? colors.textOnPrimary : colors.secondaryText }}>
                    {formatTagName(item.path)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ThemedSurface>

      <ThemedSurface className="mx-4 mt-3 overflow-hidden p-4">
        <StepLabel step={2} label="Drop pin on map" colors={colors} />
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

            {geofences.map((geofence) => (
              <Circle
                key={geofence.id}
                center={{ latitude: geofence.latitude, longitude: geofence.longitude }}
                radius={geofence.radiusMeters}
                strokeColor={geofence.enabled ? geofence.tag?.color ?? colors.primary : '#94A3B8'}
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

      <Text className="mx-4 mb-3 mt-1 text-base font-semibold" style={{ color: colors.textOnBg }}>
        Saved places
      </Text>
    </>
  );

  return (
    <TabScreenContainer>
      <FlatList
        data={geofences}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-6"
        ListHeaderComponent={setupHeader}
        ListEmptyComponent={
          <Text className="mx-4" style={{ color: colors.textMuted }}>
            No saved places yet.
          </Text>
        }
        renderItem={({ item }) => (
          <ThemedSurface className="mx-4 mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {item.name}
                </Text>
                <Text className="text-sm" style={{ color: colors.textMuted }}>
                  {formatTagName(item.tag?.name ?? 'tag')} · {item.radiusMeters}m
                </Text>
              </View>
              <Switch value={item.enabled} onValueChange={(value) => handleToggle(item, value)} />
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              className="mt-3 self-start rounded-lg px-3 py-2"
              style={{ backgroundColor: colors.destructiveBg }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.destructiveText }}>
                Delete
              </Text>
            </Pressable>
          </ThemedSurface>
        )}
      />
    </TabScreenContainer>
  );
}
