import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { ProfileIdentityCard } from '@/components/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ProfileLinkRows';
import { useAuth } from '@/hooks/useAuth';
import { useScreenTopPadding } from '@/hooks/useScreenTopPadding';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { clearTrackedData, exportTrackedDataCsv } from '@/services/dataService';
import { useProfileName } from '@/hooks/useProfileName';
import { fetchIncomingPendingCount } from '@/services/friendsService';
import { getLastAutoSyncAt, performManualSync } from '@/services/syncScheduler';

export default function ProfileScreen() {
  const router = useRouter();
  const topPadding = useScreenTopPadding(8);
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
      getLastAutoSyncAt().then(setLastSyncedAt).catch(() => undefined);
    }, [loadPendingCount, reloadProfile]),
  );

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
      Alert.alert(
        'Export ready',
        `Shared aggregated data for ${count} ${count === 1 ? 'day' : 'days'}.`,
      );
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
    ? `Last synced ${new Date(lastSyncedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : undefined;

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

          <ProfileLinkRows
            rows={[
              {
                id: 'sync',
                label: 'Upload to cloud',
                icon: 'sync',
                subtitle: lastSyncedLabel,
                onPress: handleSync,
                loading: syncing,
                disabled: syncing || exporting || clearing,
                showChevron: false,
              },
              {
                id: 'export',
                label: 'Export CSV',
                icon: 'export',
                onPress: handleExportCsv,
                loading: exporting,
                disabled: syncing || exporting || clearing,
                showChevron: false,
              },
              {
                id: 'clear',
                label: 'Clear all data',
                icon: 'clear',
                variant: 'destructive',
                onPress: handleClearAllData,
                loading: clearing,
                disabled: syncing || exporting || clearing,
                showChevron: false,
              },
            ]}
          />

          <ProfileLinkRows
            rows={[
              {
                id: 'signout',
                label: 'Sign out',
                icon: 'signout',
                variant: 'destructive',
                onPress: handleLogout,
                showChevron: false,
              },
            ]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
