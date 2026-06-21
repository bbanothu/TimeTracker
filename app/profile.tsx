import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { clearTrackedData, exportTrackedDataCsv } from '@/services/dataService';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </Text>
      <View className="rounded-2xl bg-white p-4 dark:bg-slate-900">{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <View className="relative mb-6 items-center rounded-2xl bg-white p-6 dark:bg-slate-900">
          <View className="absolute right-4 top-4">
            <DarkModeToggle />
          </View>
          <View className="items-center pt-2">
            <ProfileAvatar
              userId={user?.id}
              fallbackLabel={(user?.email?.[0] ?? '?').toUpperCase()}
            />
            <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {user?.email ?? 'Account'}
            </Text>
            {memberSince ? (
              <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Member since {memberSince}
              </Text>
            ) : null}
          </View>
        </View>

        <SettingsSection title="Account">
          <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Pressable
            onPress={handleUpdateEmail}
            disabled={savingEmail || email.trim() === user?.email}
            className="rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}
          >
            {savingEmail ? (
              <ActivityIndicator color={colors.spinnerOnPrimary} />
            ) : (
              <Text
                className="text-center font-semibold"
                style={{ color: colors.textOnPrimary }}
              >
                Save email
              </Text>
            )}
          </Pressable>
        </SettingsSection>

        <SettingsSection title="Password">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Pressable
            onPress={handleUpdatePassword}
            disabled={savingPassword || !newPassword}
            className="rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}
          >
            {savingPassword ? (
              <ActivityIndicator color={colors.spinnerOnPrimary} />
            ) : (
              <Text
                className="text-center font-semibold"
                style={{ color: colors.textOnPrimary }}
              >
                Update password
              </Text>
            )}
          </Pressable>
        </SettingsSection>

        <SettingsSection title="Data">
          <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
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
        </SettingsSection>

        <ActionButton
          label="Sign out"
          onPress={handleLogout}
          variant="destructiveOutline"
          size="lg"
          className="mb-8"
          textClassName="text-base"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
