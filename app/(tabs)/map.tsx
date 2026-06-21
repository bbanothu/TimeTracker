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

import { useTags } from '@/hooks/useTags';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAuth } from '@/hooks/useAuth';
import {
  createGeofence,
  deleteGeofence,
  getAllGeofences,
  updateGeofence,
} from '@/db/client';
import {
  geofenceService,
  requestBackgroundPermissions,
  requestLocationPermissions,
  syncGeofencingTask,
} from '@/services/geofenceService';
import { syncService } from '@/services/syncService';
import { ActionButton } from '@/components/ActionButton';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import { formatTagName } from '@/utils/formatDuration';
import { flattenTags } from '@/utils/tagTree';
import type { Geofence } from '@/types';

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

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
  const insideIdsRef = useRef<Set<string>>(new Set());

  const loadGeofences = useCallback(() => {
    setGeofences(getAllGeofences());
  }, []);

  const pushSync = useCallback(async () => {
    if (user) {
      await syncService.push(user.id);
    }
  }, [user]);

  const refreshGeofencing = useCallback(async () => {
    try {
      await syncGeofencingTask();
    } catch (error) {
      console.warn('Background geofencing unavailable in Expo Go:', error);
    }
  }, []);

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
    refreshGeofencing();
  }, [geofences, refreshGeofencing]);

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
    if (draftLat == null || draftLng == null) {
      Alert.alert('Pick a location', 'Tap the map to place a geofence pin.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this place a name.');
      return;
    }
    if (!selectedTagId) {
      Alert.alert('Tag required', 'Link this place to a tag.');
      return;
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
    await refreshGeofencing();
    await pushSync();
    Alert.alert('Saved', 'Geofence added.');
  };

  const handleToggle = async (geofence: Geofence, enabled: boolean) => {
    updateGeofence(geofence.id, { enabled });
    loadGeofences();
    await refreshGeofencing();
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
          await refreshGeofencing();
          await pushSync();
        },
      },
    ]);
  };

  const handleEnableBackground = async () => {
    const granted = await requestBackgroundPermissions();
    Alert.alert(
      granted ? 'Background enabled' : 'Permission needed',
      granted
        ? 'Background geofencing is configured. For best results, use a development build.'
        : 'Enable Always Allow location in Settings for automatic background tracking.',
    );
    if (granted) {
      await refreshGeofencing();
    }
  };

  return (
    <TabScreenContainer>
      <View className="flex-1">
      {showBanner ? (
        <View className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <Text className="text-sm text-amber-900 dark:text-amber-200">
            Expo Go supports foreground geofence checks while the app is open. Full background auto-tracking
            works best in a development build.
          </Text>
          <Pressable onPress={() => setShowBanner(false)} className="mt-2">
            <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <MapView
        style={{ height: 280 }}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {draftLat != null && draftLng != null ? (
          <>
            <Marker coordinate={{ latitude: draftLat, longitude: draftLng }} title="New place" />
            <Circle
              center={{ latitude: draftLat, longitude: draftLng }}
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

      <View
        className="border-b px-4 py-3"
        style={{ borderBottomColor: colors.glassBorder, backgroundColor: colors.glass }}
      >
        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textSecondary }}>
          Tap map to drop a pin
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Office"
          placeholderTextColor={colors.inputPlaceholder}
          className="mb-2 rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
        <TextInput
          value={radius}
          onChangeText={setRadius}
          placeholder="Radius in meters"
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="number-pad"
          className="mb-2 rounded-xl border px-4 py-2 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
        <View className="mb-3 flex-row flex-wrap">
          {flatTags.map((item) => {
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
                  #{item.path}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row gap-2">
          <ActionButton label="Save geofence" onPress={handleSaveGeofence} className="flex-1" />
          <ActionButton label="Background" onPress={handleEnableBackground} variant="secondary" />
        </View>
      </View>

      <FlatList
        data={geofences}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-3"
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted }}>No geofences yet.</Text>
        }
        renderItem={({ item }) => (
          <ThemedSurface className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <View>
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
      </View>
    </TabScreenContainer>
  );
}
