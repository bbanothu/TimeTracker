import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AppBackground } from '@/components/AppBackground';
import { SettingsGroup } from '@/components/SettingsGroup';
import { TabPageHeader } from '@/components/TabPageHeader';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useProfileName } from '@/hooks/useProfileName';

export default function SettingsScreen() {
  const colors = useAppColors();
  const { updatePassword } = useAuth();
  const {
    firstName,
    lastName,
    setFirstName,
    setLastName,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
  } = useProfileName();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const nameInputStyle = {
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword) {
      Alert.alert('Current password required', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both new password fields match.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Same password', 'Choose a different password than your current one.');
      return;
    }

    try {
      setSavingPassword(true);
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <TabPageHeader title="Settings" showBack />
          <View className="px-4">
            <Text className="mb-2 text-base font-semibold" style={{ color: colors.textOnBg }}>
              Name
            </Text>
            <SettingsGroup>
              <View className="flex-row gap-3 px-4 py-3">
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
                    First name
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Jane"
                    placeholderTextColor={colors.inputPlaceholder}
                    autoComplete="given-name"
                    editable={!profileLoading}
                    className="rounded-lg px-3 py-2.5 text-[15px]"
                    style={[nameInputStyle, profileLoading ? { color: colors.textDisabled } : null]}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
                    Last name
                  </Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={colors.inputPlaceholder}
                    autoComplete="family-name"
                    editable={!profileLoading}
                    className="rounded-lg px-3 py-2.5 text-[15px]"
                    style={[nameInputStyle, profileLoading ? { color: colors.textDisabled } : null]}
                  />
                </View>
              </View>
              <Text
                className="border-t px-4 py-2.5 text-xs"
                style={{ color: colors.textMuted, borderTopColor: colors.separator }}
              >
                Friends see this name when you share stats.
                {profileSaving ? ' Saving…' : ''}
              </Text>
            </SettingsGroup>
            {profileError ? (
              <Text className="mb-3 text-sm text-rose-500">{profileError}</Text>
            ) : null}

            <Text className="mb-2 mt-4 text-base font-semibold" style={{ color: colors.textOnBg }}>
              Password
            </Text>
            <ThemedSurface className="mb-4 p-4">
              <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
                Enter your current password, then choose a new one.
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                autoComplete="password"
                className="mb-3 rounded-xl border px-4 py-3 text-base"
                style={inputStyle}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                autoComplete="password-new"
                className="mb-3 rounded-xl border px-4 py-3 text-base"
                style={inputStyle}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                autoComplete="password-new"
                className="mb-3 rounded-xl border px-4 py-3 text-base"
                style={inputStyle}
              />
              <ActionButton
                label="Update password"
                onPress={handlePasswordSubmit}
                loading={savingPassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              />
            </ThemedSurface>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
