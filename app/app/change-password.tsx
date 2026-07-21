import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
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
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useScreenTopPadding } from '@/hooks/useScreenTopPadding';
import { getStackScreenOptions } from '@/navigation/headerOptions';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const topPadding = useScreenTopPadding(8);
  const colors = useAppColors();
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions(
      getStackScreenOptions(colors, 'Password')({ navigation: navigation as never }),
    );
  }, [colors, navigation]);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const handleSubmit = async () => {
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
      setSaving(true);
      await updatePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'Your password has been changed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pb-8"
          style={{ paddingTop: topPadding }}
          keyboardShouldPersistTaps="handled"
        >
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
              onPress={handleSubmit}
              loading={saving}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            />
          </ThemedSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
