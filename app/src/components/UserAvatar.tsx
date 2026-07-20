import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface UserAvatarProps {
  photoUri: string | null;
  fallbackLabel: string;
  size: number;
  showIconFallback?: boolean;
}

export function UserAvatar({
  photoUri,
  fallbackLabel,
  size,
  showIconFallback = false,
}: UserAvatarProps) {
  const colors = useAppColors();

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  if (showIconFallback) {
    return <Ionicons name="person-circle-outline" size={size} color={colors.textOnBg} />;
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: colors.selectedBg }}
    >
      <Text className="font-bold" style={{ fontSize: size * 0.4, color: colors.primary }}>
        {fallbackLabel}
      </Text>
    </View>
  );
}
