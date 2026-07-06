import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { ProfileFooter } from '@/components/ProfileFooter';
import { ProfileIdentityCard } from '@/components/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ProfileLinkRows';
import { useAuth } from '@/hooks/useAuth';
import { useGeofenceMonitoring } from '@/hooks/useGeofenceMonitoring';
import { useScreenScrollPadding } from '@/hooks/useScreenTopPadding';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { clearTrackedData, exportTrackedDataCsv } from '@/services/dataService';
import { useProfileName } from '@/hooks/useProfileName';
import { fetchIncomingPendingCount } from '@/services/friendsService';
import { getLastAutoSyncAt, performManualSync } from '@/services/syncScheduler';
import {
  connectGoogleCalendarInBrowser,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  resetAndSyncGoogleCalendar,
  syncGoogleCalendar,
} from '@/services/googleCalendarService';
import type { GoogleCalendarStatus, GoogleCalendarSyncResult } from '@/types/googleCalendar';

function formatCalendarResetMessage(result: GoogleCalendarSyncResult): string {
  const parts: string[] = [];
  if (result.removed != null && result.removed > 0) {
    parts.push(`Removed ${result.removed} old ${result.removed === 1 ? 'event' : 'events'}`);
  }
  if (result.created > 0) {
    parts.push(`created ${result.created} new ${result.created === 1 ? 'event' : 'events'}`);
  }
  const failures = (result.failed ?? 0) + (result.removeFailed ?? 0);
  if (failures > 0) {
    parts.push(`${failures} failed`);
  }
  return parts.length > 0 ? `${parts.join(', ')}.` : 'Calendar re-synced with tag colors.';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { calendar } = useLocalSearchParams<{ calendar?: string }>();
  const { paddingTop, paddingBottom } = useScreenScrollPadding({ topExtra: 8, bottomExtra: 32 });
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarResetting, setCalendarResetting] = useState(false);
  const [calendarDisconnecting, setCalendarDisconnecting] = useState(false);
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
  const {
    status,
    enabledCount,
    enabling,
    enableBackgroundTracking,
    disableBackgroundTracking,
    refreshStatus,
  } = useGeofenceMonitoring();

  const autoTrackingOn = status === 'background_active';
  const autoTrackingSubtitle =
    enabledCount === 0
      ? 'Save a place on the Map tab first'
      : autoTrackingOn
        ? 'Tracks arrivals when the app is closed'
        : 'Only tracks while the app is open';

  const handleAutoTrackingToggle = async (next: boolean) => {
    if (enabledCount === 0) return;

    if (next) {
      const granted = await enableBackgroundTracking();
      if (!granted) {
        Alert.alert(
          'Always Allow location required',
          'Open Settings, choose Location, then Always Allow so TimeTracker can auto-start when you arrive at saved places.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }

    await disableBackgroundTracking();
  };

  const loadPendingCount = useCallback(() => {
    fetchIncomingPendingCount()
      .then(setPendingFriendCount)
      .catch(() => undefined);
  }, []);

  const loadCalendarStatus = useCallback(async () => {
    try {
      setCalendarLoading(true);
      setCalendarStatus(await getGoogleCalendarStatus());
    } catch {
      setCalendarStatus(null);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPendingCount();
      reloadProfile().catch(console.error);
      getLastAutoSyncAt()
        .then(setLastSyncedAt)
        .catch(() => undefined);
      refreshStatus().catch(console.warn);
      loadCalendarStatus().catch(console.error);
    }, [loadPendingCount, reloadProfile, refreshStatus, loadCalendarStatus]),
  );

  useFocusEffect(
    useCallback(() => {
      if (calendar !== 'connected') return;
      Alert.alert('Google Calendar', 'Your Google account is connected.');
      loadCalendarStatus().catch(console.error);
      router.setParams({ calendar: undefined });
    }, [calendar, loadCalendarStatus, router]),
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
                Alert.alert(
                  'Clear failed',
                  error instanceof Error ? error.message : 'Unknown error',
                );
              })
              .finally(() => setClearing(false));
          },
        },
      ],
    );
  };

  const handleConnectCalendar = async () => {
    try {
      setCalendarConnecting(true);
      const connected = await connectGoogleCalendarInBrowser();
      if (connected) {
        await loadCalendarStatus();
        Alert.alert('Google Calendar', 'Your Google account is connected.');
      }
    } catch (error) {
      Alert.alert(
        'Connect failed',
        error instanceof Error ? error.message : 'Could not connect Google Calendar',
      );
    } finally {
      setCalendarConnecting(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setCalendarSyncing(true);
      const result = await syncGoogleCalendar();
      await loadCalendarStatus();
      if (result.created === 0 && result.failed === 0) {
        Alert.alert('Calendar sync', 'Your calendar is up to date.');
      } else {
        Alert.alert(
          'Calendar sync',
          `Added ${result.created} ${result.created === 1 ? 'event' : 'events'} to Google Calendar.`,
        );
      }
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Calendar sync failed');
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleResetCalendar = () => {
    Alert.alert(
      'Reset & re-sync calendar',
      'This deletes all TimeTracker events from your Google Calendar and re-creates them with your current tag colors and details. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & sync',
          style: 'destructive',
          onPress: () => {
            setCalendarResetting(true);
            resetAndSyncGoogleCalendar()
              .then((result) => loadCalendarStatus().then(() => result))
              .then((result) => Alert.alert('Calendar reset', formatCalendarResetMessage(result)))
              .catch((error) => {
                Alert.alert(
                  'Reset failed',
                  error instanceof Error ? error.message : 'Calendar reset failed',
                );
              })
              .finally(() => setCalendarResetting(false));
          },
        },
      ],
    );
  };

  const handleDisconnectCalendar = () => {
    Alert.alert('Disconnect Google Calendar', 'Stop exporting sessions to Google?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          setCalendarDisconnecting(true);
          disconnectGoogleCalendar()
            .then(() => loadCalendarStatus())
            .then(() => Alert.alert('Google Calendar', 'Disconnected.'))
            .catch((error) => {
              Alert.alert(
                'Disconnect failed',
                error instanceof Error ? error.message : 'Could not disconnect',
              );
            })
            .finally(() => setCalendarDisconnecting(false));
        },
      },
    ]);
  };

  const calendarConnected = calendarStatus?.connected === true;
  const calendarBusy =
    calendarLoading ||
    calendarConnecting ||
    calendarSyncing ||
    calendarResetting ||
    calendarDisconnecting;
  const calendarSubtitle = calendarLoading
    ? 'Checking connection…'
    : calendarConnected
      ? [
          calendarStatus.googleEmail,
          calendarStatus.pendingCount > 0 ? `${calendarStatus.pendingCount} pending` : 'Up to date',
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Export your sessions as calendar events';

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
              Alert.alert(
                'Sign out failed',
                error instanceof Error ? error.message : 'Unknown error',
              );
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
          className="flex-1 px-4"
          style={{ paddingTop }}
          contentContainerStyle={{ paddingBottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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

          {profileError ? <Text className="mb-3 text-sm text-rose-500">{profileError}</Text> : null}

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
              {
                id: 'autotracking',
                label: 'Auto tracking',
                icon: 'autotracking',
                subtitle: autoTrackingSubtitle,
                disabled: enabledCount === 0 || enabling,
                loading: enabling,
                toggle: {
                  value: autoTrackingOn,
                  onValueChange: (value) => {
                    handleAutoTrackingToggle(value).catch(console.warn);
                  },
                },
              },
            ]}
          />

          <ProfileLinkRows
            rows={[
              {
                id: 'calendar',
                label: calendarConnected ? 'Sync to Calendar' : 'Connect Google Calendar',
                icon: 'calendar',
                subtitle: calendarSubtitle,
                onPress: calendarConnected ? handleSyncCalendar : handleConnectCalendar,
                loading: calendarConnecting || calendarSyncing,
                disabled: calendarBusy || syncing || exporting || clearing,
                showChevron: false,
              },
              ...(calendarConnected
                ? [
                    {
                      id: 'calendar-reset',
                      label: 'Reset & re-sync calendar',
                      icon: 'calendar' as const,
                      subtitle: 'Delete TimeTracker events and re-create with tag colors',
                      onPress: handleResetCalendar,
                      loading: calendarResetting,
                      disabled: calendarBusy || syncing || exporting || clearing,
                      showChevron: false,
                    },
                    {
                      id: 'calendar-disconnect',
                      label: 'Disconnect Google Calendar',
                      icon: 'calendar' as const,
                      subtitle: 'Stop exporting sessions to Google',
                      onPress: handleDisconnectCalendar,
                      loading: calendarDisconnecting,
                      disabled: calendarBusy || syncing || exporting || clearing,
                      showChevron: false,
                    },
                  ]
                : []),
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

          <ProfileFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
