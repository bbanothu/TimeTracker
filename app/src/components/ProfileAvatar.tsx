import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { UserAvatar } from '@/components/UserAvatar';
import { useAppColors } from '@/hooks/useAppColors';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { saveAndSyncProfilePhoto } from '@/services/profilePhotoService';

interface ProfileAvatarProps {
  userId: string | undefined;
  fallbackLabel: string;
  compact?: boolean;
}

export function ProfileAvatar({ userId, fallbackLabel, compact = false }: ProfileAvatarProps) {
  const colors = useAppColors();
  const { photoUri, setPhotoUri } = useProfilePhoto(userId);
  const [loading, setLoading] = useState(false);
  const size = compact ? 52 : 80;

  const handlePickPhoto = useCallback(async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      setLoading(true);
      const savedUri = await saveAndSyncProfilePhoto(userId, result.assets[0].uri);
      setPhotoUri(savedUri);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not save photo');
    } finally {
      setLoading(false);
    }
  }, [userId, setPhotoUri]);

  return (
    <View className={compact ? 'relative' : 'relative mb-3'}>
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{ width: size, height: size, backgroundColor: colors.selectedBg }}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <UserAvatar photoUri={photoUri} fallbackLabel={fallbackLabel} size={size} />
        )}
      </View>

      <Pressable
        onPress={handlePickPhoto}
        disabled={loading || !userId}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        className="absolute items-center justify-center rounded-full border-2"
        style={{
          width: compact ? 22 : 28,
          height: compact ? 22 : 28,
          bottom: compact ? -2 : -4,
          right: compact ? -2 : -4,
          backgroundColor: colors.primary,
          borderColor: colors.surface,
        }}
      >
        <Ionicons name="add" size={compact ? 12 : 16} color={colors.textOnPrimary} />
      </Pressable>
    </View>
  );
}
