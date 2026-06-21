import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

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
  const { user, signOut, updateEmail, updatePassword } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
        <View className="mb-6 items-center rounded-2xl bg-white p-6 dark:bg-slate-900">
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
            className="rounded-xl bg-blue-600 py-3"
          >
            {savingEmail ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-semibold text-white">Save email</Text>
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
            className="rounded-xl bg-blue-600 py-3"
          >
            {savingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-semibold text-white">Update password</Text>
            )}
          </Pressable>
        </SettingsSection>

        <SettingsSection title="Appearance">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-slate-900 dark:text-slate-100">
                Dark mode
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {isDark ? 'On' : 'Off'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(enabled) => setTheme(enabled ? 'dark' : 'light')}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SettingsSection>

        <Pressable onPress={handleLogout} className="mb-8 rounded-2xl bg-rose-100 py-4 dark:bg-rose-950">
          <Text className="text-center text-base font-semibold text-rose-700 dark:text-rose-300">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
