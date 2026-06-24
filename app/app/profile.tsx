import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AppBackground } from '@/components/AppBackground';
import { ProfileIdentityCard } from '@/components/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ProfileLinkRows';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useScreenTopPadding } from '@/hooks/useScreenTopPadding';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { clearTrackedData, exportTrackedDataCsv } from '@/services/dataService';
import { useProfileName } from '@/hooks/useProfileName';
import { fetchIncomingPendingCount } from '@/services/friendsService';
import { getLastAutoSyncAt, performManualSync } from '@/services/syncScheduler';

export default function ProfileScreen() {
  const router = useRouter();
  const topPadding = useScreenTopPadding(8);
  const colors = useAppColors();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const {
    firstName,
    lastName,
    setFirstName,
    setLastName,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
    reload: reloadProfile,
  } = useProfileName();

  const loadPendingCount = useCallback(() => {
    fetchIncomingPendingCount()
      .then(setPendingFriendCount)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPendingCount();
      reloadProfile().catch(console.error);
    }, [loadPendingCount, reloadProfile]),
  );

  useEffect(() => {
    getLastAutoSyncAt().then(setLastSyncedAt).catch(() => undefined);
  }, []);

  const handleSync = async () => {
    if (!user?.id) return;

    try {
      setSyncing(true);
      const result = await performManualSync(user.id);
      if (result.skippedReason === 'offline') {
        Alert.alert('Sync unavailable', 'Connect to the internet and try again.');
        return;
      }
      if (result.skippedReason === 'not_configured') {
        Alert.alert('Sync unavailable', 'Cloud sync is not configured for this app.');
        return;
      }
      const syncedAt = Date.now();
      setLastSyncedAt(syncedAt);
      notifyDataRefresh();
      Alert.alert('Sync complete', 'Your local changes have been uploaded to the cloud.');
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSyncing(false);
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

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

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
          <ProfileIdentityCard
            email={user?.email ?? ''}
            memberSince={memberSince}
            userId={user?.id}
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            saving={profileSaving}
            disabled={profileLoading}
          />

          {profileError ? (
            <Text className="mb-3 text-sm text-rose-500">{profileError}</Text>
          ) : null}

          <ProfileLinkRows
            rows={[
              {
                id: 'friends',
                label: 'Friends',
                icon: 'friends',
                badge: pendingFriendCount,
                onPress: () => router.push('/friends'),
              },
              {
                id: 'history',
                label: 'History',
                icon: 'history',
                onPress: () => router.push('/history'),
              },
              {
                id: 'password',
                label: 'Password',
                icon: 'password',
                onPress: () => router.push('/change-password'),
              },
            ]}
          />

          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Data
            </Text>
            <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
              Your data downloads when you sign in. Changes upload automatically when you stop a
              session, edit tags, or update saved places. Use Upload to cloud to retry a failed
              upload. You can also export tracked time or permanently remove all time entries.
            </Text>
            {lastSyncedLabel ? (
              <Text className="mb-3 text-xs" style={{ color: colors.textMuted }}>
                Last synced {lastSyncedLabel}
              </Text>
            ) : null}
            <ActionButton
              label="Upload to cloud"
              onPress={handleSync}
              variant="secondary"
              loading={syncing}
              disabled={syncing || exporting || clearing}
              className="mb-4"
            />
            <View className="flex-row gap-3">
              <ActionButton
                label="Export to CSV"
                onPress={handleExportCsv}
                disabled={exporting || clearing || syncing}
                loading={exporting}
                className="flex-1"
              />
              <ActionButton
                label="Clear all data"
                onPress={handleClearAllData}
                variant="destructiveOutline"
                disabled={exporting || clearing || syncing}
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
