import { useRouter } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useState } from 'react';
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
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { clearTrackedData, exportTrackedDataCsv } from '@/services/dataService';

export default function ProfileScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const colors = useAppColors();
  const { user, signOut, updateEmail, updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  const handleUpdateEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email required', 'Enter a valid email address.');
      return;
    }
    if (trimmed === user?.email) return;

    try {
      setSavingEmail(true);
      await updateEmail(trimmed);
      Alert.alert('Email updated', 'Check your inbox if email confirmation is required.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    try {
      setSavingPassword(true);
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportCsv = async () => {
    if (!user?.id) return;

    try {
      setExporting(true);
      const count = await exportTrackedDataCsv(user.id);
      Alert.alert('Export ready', `Shared ${count} time ${count === 1 ? 'entry' : 'entries'} as CSV.`);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const handleClearAllData = () => {
    if (!user?.id) return;

    Alert.alert(
      'Clear all data',
      'This permanently deletes all tracked time entries on this device and in the cloud. Tags and geofences are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all data',
          style: 'destructive',
          onPress: () => {
            setClearing(true);
            clearTrackedData(user.id)
              .then((count) => {
                Alert.alert(
                  'Data cleared',
                  count > 0
                    ? `Removed ${count} time ${count === 1 ? 'entry' : 'entries'}.`
                    : 'No time entries were found.',
                );
              })
              .catch((error) => {
                Alert.alert('Clear failed', error instanceof Error ? error.message : 'Unknown error');
              })
              .finally(() => setClearing(false));
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Your local cache will be cleared. Cloud data stays saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut()
            .then(() => router.replace('/(auth)/login'))
            .catch((error) => {
              Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Unknown error');
            });
        },
      },
    ]);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pb-8"
          style={{ paddingTop: headerHeight + 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedSurface className="mb-4 px-3 py-3">
            <View className="flex-row items-center gap-3">
              <ProfileAvatar
                compact
                userId={user?.id}
                fallbackLabel={(user?.email?.[0] ?? '?').toUpperCase()}
              />
              <View className="min-w-0 flex-1">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.textOnBg }}
                  numberOfLines={1}
                >
                  {user?.email ?? 'Account'}
                </Text>
                {memberSince ? (
                  <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
                    Member since {memberSince}
                  </Text>
                ) : null}
              </View>
              <DarkModeToggle />
            </View>
          </ThemedSurface>

          {/* <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Account
            </Text>
            <Text className="mb-2 text-sm" style={{ color: colors.textMuted }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-3 rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
            />
            <ActionButton
              label="Save email"
              onPress={handleUpdateEmail}
              loading={savingEmail}
              disabled={savingEmail || email.trim() === user?.email}
            />
          </ThemedSurface> */}

          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry
              className="mb-3 rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry
              className="mb-3 rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
            />
            <ActionButton
              label="Update password"
              onPress={handleUpdatePassword}
              loading={savingPassword}
              disabled={savingPassword || !newPassword}
            />
          </ThemedSurface>

          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Data
            </Text>
            <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
              Export your tracked time or permanently remove all time entries. Tags and geofences are
              not affected.
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                label="Export to CSV"
                onPress={handleExportCsv}
                disabled={exporting || clearing}
                loading={exporting}
                className="flex-1"
              />
              <ActionButton
                label="Clear all data"
                onPress={handleClearAllData}
                variant="destructiveOutline"
                disabled={exporting || clearing}
                loading={clearing}
                className="flex-1"
              />
            </View>
          </ThemedSurface>

          <ActionButton
            label="Sign out"
            onPress={handleLogout}
            variant="destructiveOutline"
            size="lg"
            className="mb-8"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
