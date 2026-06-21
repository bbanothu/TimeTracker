import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { UserAvatar } from '@/components/UserAvatar';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { saveProfilePhoto } from '@/services/profilePhotoService';

interface ProfileAvatarProps {
  userId: string | undefined;
  fallbackLabel: string;
}

export function ProfileAvatar({ userId, fallbackLabel }: ProfileAvatarProps) {
  const { photoUri, setPhotoUri } = useProfilePhoto(userId);
  const [loading, setLoading] = useState(false);

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
      const savedUri = await saveProfilePhoto(userId, result.assets[0].uri);
      setPhotoUri(savedUri);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not save photo');
    } finally {
      setLoading(false);
    }
  }, [userId, setPhotoUri]);

  return (
    <View className="relative mb-3">
      <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
        {loading ? (
          <ActivityIndicator color="#2563EB" />
        ) : (
          <UserAvatar photoUri={photoUri} fallbackLabel={fallbackLabel} size={80} />
        )}
      </View>

      <Pressable
        onPress={handlePickPhoto}
        disabled={loading || !userId}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:border-slate-900"
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
