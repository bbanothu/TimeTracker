import { Text, TextInput, View } from 'react-native';

import { DarkModeToggle } from '@/components/DarkModeToggle';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';

interface ProfileIdentityCardProps {
  email: string;
  memberSince?: string | null;
  userId?: string;
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  saving?: boolean;
  disabled?: boolean;
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
  onFirstNameChange,
  onLastNameChange,
  saving = false,
  disabled = false,
}: ProfileIdentityCardProps) {
  const colors = useAppColors();
  const name = displayName(firstName, lastName);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <ThemedSurface className="mb-4 p-4">
      <View className="mb-4 flex-row items-start gap-3">
        <ProfileAvatar
          compact
          userId={userId}
          fallbackLabel={avatarInitial(firstName, lastName, email)}
        />
        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: colors.textOnBg }}
            numberOfLines={1}
          >
            {name ?? 'Add your name'}
          </Text>
          <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
            {email}
          </Text>
          {memberSince ? (
            <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
              Member since {memberSince}
            </Text>
          ) : null}
        </View>
        <DarkModeToggle />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
            First name
          </Text>
          <TextInput
            value={firstName}
            onChangeText={onFirstNameChange}
            placeholder="Jane"
            placeholderTextColor={colors.inputPlaceholder}
            autoComplete="given-name"
            editable={!disabled}
            className="rounded-xl border px-3 py-2.5 text-sm"
            style={[inputStyle, disabled ? { color: colors.textDisabled } : null]}
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
            Last name
          </Text>
          <TextInput
            value={lastName}
            onChangeText={onLastNameChange}
            placeholder="Doe"
            placeholderTextColor={colors.inputPlaceholder}
            autoComplete="family-name"
            editable={!disabled}
            className="rounded-xl border px-3 py-2.5 text-sm"
            style={[inputStyle, disabled ? { color: colors.textDisabled } : null]}
          />
        </View>
      </View>
      <Text className="mt-2.5 text-xs" style={{ color: colors.textMuted }}>
        Friends see this name when you share stats.{saving ? ' Saving…' : ''}
      </Text>
    </ThemedSurface>
  );
}
