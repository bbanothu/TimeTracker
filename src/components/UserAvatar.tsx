import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

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
    return <Ionicons name="person-circle-outline" size={size} color="#64748B" />;
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950"
      style={{ width: size, height: size }}
    >
      <Text
        className="font-bold text-blue-600 dark:text-blue-400"
        style={{ fontSize: size * 0.4 }}
      >
        {fallbackLabel}
      </Text>
    </View>
  );
}
