import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

export function ProfileButton() {
  const router = useRouter();
  const { user } = useAuth();
  const { photoUri, refresh } = useProfilePhoto(user?.id);
  const fallbackLabel = (user?.email?.[0] ?? '?').toUpperCase();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel="Open account settings"
      className="mr-3"
    >
      <UserAvatar photoUri={photoUri} fallbackLabel={fallbackLabel} size={36} showIconFallback />
    </Pressable>
  );
}
