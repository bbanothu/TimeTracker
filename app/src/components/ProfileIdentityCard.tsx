import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useAppColors } from '@/hooks/useAppColors';

interface ProfileIdentityCardProps {
  email: string;
  memberSince?: string | null;
  userId?: string;
  firstName: string;
  lastName: string;
  onSettingsPress: () => void;
}

function displayName(firstName: string, lastName: string): string | null {
  const full = `${firstName.trim()} ${lastName.trim()}`.trim();
  return full || null;
}

function avatarInitial(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

export function ProfileIdentityCard({
  email,
  memberSince,
  userId,
  firstName,
  lastName,
  onSettingsPress,
}: ProfileIdentityCardProps) {
  const colors = useAppColors();
  const name = displayName(firstName, lastName);

  return (
    <View className="mb-4">
      <View className="mb-1 flex-row items-start gap-3 px-1">
        <ProfileAvatar
          compact
          userId={userId}
          fallbackLabel={avatarInitial(firstName, lastName, email)}
        />
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold" style={{ color: colors.textOnBg }} numberOfLines={1}>
            {name ?? 'Add your name'}
          </Text>
          <Text className="mt-0.5 text-sm" style={{ color: colors.textMuted }} numberOfLines={1}>
            {email}
          </Text>
          {memberSince ? (
            <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
              Member since {memberSince}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          className="h-9 w-9 items-center justify-center overflow-hidden rounded-full active:opacity-80"
          style={{
            backgroundColor: colors.glass,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <Ionicons name="settings-outline" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
