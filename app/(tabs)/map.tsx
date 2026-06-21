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
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
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
              strokeColor="#2563EB"
              fillColor="rgba(37, 99, 235, 0.15)"
            />
          </>
        ) : null}

        {geofences.map((geofence) => (
          <Circle
            key={geofence.id}
            center={{ latitude: geofence.latitude, longitude: geofence.longitude }}
            radius={geofence.radiusMeters}
            strokeColor={geofence.enabled ? geofence.tag?.color ?? '#3B82F6' : '#94A3B8'}
            fillColor={`${geofence.tag?.color ?? '#3B82F6'}33`}
          />
        ))}
      </MapView>

      <View className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Tap map to drop a pin
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Office"
          placeholderTextColor="#94A3B8"
          className="mb-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <TextInput
          value={radius}
          onChangeText={setRadius}
          placeholder="Radius in meters"
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          className="mb-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <View className="mb-3 flex-row flex-wrap">
          {flatTags.map((item) => (
            <Pressable
              key={item.tag.id}
              onPress={() => setSelectedTagId(item.tag.id)}
              className={`mr-2 mb-2 rounded-full px-3 py-2 ${
                selectedTagId === item.tag.id ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <Text
                className={
                  selectedTagId === item.tag.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                }
              >
                #{item.path}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row gap-2">
          <Pressable onPress={handleSaveGeofence} className="flex-1 rounded-xl bg-blue-600 py-3">
            <Text className="text-center font-semibold text-white">Save geofence</Text>
          </Pressable>
          <Pressable
            onPress={handleEnableBackground}
            className="rounded-xl bg-slate-200 px-4 py-3 dark:bg-slate-700"
          >
            <Text className="font-semibold text-slate-700 dark:text-slate-200">Background</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={geofences}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-3"
        ListEmptyComponent={
          <Text className="text-slate-500 dark:text-slate-400">No geofences yet.</Text>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {item.name}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {formatTagName(item.tag?.name ?? 'tag')} · {item.radiusMeters}m
                </Text>
              </View>
              <Switch value={item.enabled} onValueChange={(value) => handleToggle(item, value)} />
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              className="mt-3 self-start rounded-lg bg-rose-100 px-3 py-2 dark:bg-rose-950"
            >
              <Text className="text-sm font-medium text-rose-700 dark:text-rose-300">Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
