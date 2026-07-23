import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileFooter } from '@/components/layout/ProfileFooter';
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal';
import { ProfileIdentityCard } from '@/components/ui/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ui/ProfileLinkRows';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { deleteAccount } from '@/services/accountService';
import {
  deleteAllEntries,
  downloadCsv,
  exportEntriesCsv,
  fetchAllEntries,
  fetchTags,
} from '@/services/data';
import { useProfileName } from '@/hooks/useProfileName';
import { buildProfileDisplayName } from '@/services/profileService';
import { fetchIncomingPendingCount } from '@/services/friendsService';
import { aggregatedExportDayCount } from '@/utils/aggregatedExportCsv';
import {
  buildWebCalendarReturnUrl,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  resetAndSyncGoogleCalendar,
  startGoogleCalendarConnect,
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

export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { refreshAll, refreshing } = useRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
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
    reload: reloadProfile,
  } = useProfileName();

  const loadPendingCount = useCallback(() => {
    fetchIncomingPendingCount().then(setPendingFriendCount).catch(console.error);
  }, []);

  const loadCalendarStatus = useCallback(async () => {
    try {
      setCalendarLoading(true);
      setCalendarStatus(await getGoogleCalendarStatus());
    } catch (err) {
      console.error(err);
      setCalendarStatus(null);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/profile') {
      loadPendingCount();
      reloadProfile().catch(console.error);
      loadCalendarStatus().catch(console.error);
    }
  }, [location.pathname, loadPendingCount, reloadProfile, loadCalendarStatus]);

  useEffect(() => {
    if (searchParams.get('calendar') !== 'connected') return;
    setMessage('Google Calendar connected.');
    loadCalendarStatus().catch(console.error);
    const next = new URLSearchParams(searchParams);
    next.delete('calendar');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, loadCalendarStatus]);

  if (!user) return <Navigate to="/login" replace />;

  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshAll();
      setLastRefreshedAt(Date.now());
      setMessage('Data refreshed from the cloud.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      const [entries, tags] = await Promise.all([fetchAllEntries(user.id), fetchTags(user.id)]);
      if (entries.length === 0) {
        setError('No time entries to export.');
        return;
      }
      const personName = buildProfileDisplayName({ firstName, lastName }) ?? user.email ?? 'Me';
      const csv = exportEntriesCsv(entries, tags, personName);
      downloadCsv(`timetracker-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      const dayCount = aggregatedExportDayCount(entries);
      setMessage(`Downloaded ${dayCount} ${dayCount === 1 ? 'day' : 'days'} of aggregated data.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleClear = async () => {
    if (
      !window.confirm(
        'This permanently deletes all tracked time entries in the cloud. Tags and geofences are kept. This cannot be undone.',
      )
    ) {
      return;
    }
    try {
      setClearing(true);
      setError(null);
      const count = await deleteAllEntries(user.id);
      notifyDataRefresh();
      setMessage(`Removed ${count} entries.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    } finally {
      setClearing(false);
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Your local session will end. Cloud data stays saved.')) return;
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async (password: string) => {
    setDeletingAccount(true);
    setError(null);
    try {
      await deleteAccount(password);
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setDeletingAccount(false);
    }
  };

  const accountBusy =
    refreshing ||
    exporting ||
    clearing ||
    deletingAccount ||
    calendarConnecting ||
    calendarSyncing ||
    calendarResetting ||
    calendarDisconnecting;

  const handleConnectCalendar = async () => {
    try {
      setCalendarConnecting(true);
      setError(null);
      const authUrl = await startGoogleCalendarConnect(buildWebCalendarReturnUrl());
      window.location.assign(authUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect Google Calendar');
      setCalendarConnecting(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setCalendarSyncing(true);
      setError(null);
      const result = await syncGoogleCalendar();
      await loadCalendarStatus();
      if (result.failed > 0) {
        setError(
          result.error
            ? `Synced ${result.created}, failed ${result.failed}. ${result.error}`
            : `Synced ${result.created}, failed ${result.failed}.`,
        );
      } else if (result.created === 0) {
        setMessage('Calendar is up to date.');
      } else {
        setMessage(
          `Synced ${result.created} ${result.created === 1 ? 'event' : 'events'} to Google Calendar.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calendar sync failed');
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleResetCalendar = async () => {
    if (
      !window.confirm(
        'This deletes all TimeTracker events from your Google Calendar and re-creates them with your current tag colors and details. Continue?',
      )
    ) {
      return;
    }
    try {
      setCalendarResetting(true);
      setError(null);
      const result = await resetAndSyncGoogleCalendar();
      await loadCalendarStatus();
      setMessage(formatCalendarResetMessage(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calendar reset failed');
    } finally {
      setCalendarResetting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Disconnect Google Calendar from TimeTracker?')) return;
    try {
      setCalendarDisconnecting(true);
      setError(null);
      await disconnectGoogleCalendar();
      await loadCalendarStatus();
      setMessage('Google Calendar disconnected.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect Google Calendar');
    } finally {
      setCalendarDisconnecting(false);
    }
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
          calendarStatus.lastSyncedAt
            ? `Last synced ${new Date(calendarStatus.lastSyncedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Export your sessions as calendar events';

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const lastRefreshedLabel = lastRefreshedAt
    ? `Last refreshed ${new Date(lastRefreshedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1">
        <PageHeader
          title="Account"
          showMobileActions={false}
          backLink={{ to: '/', label: '← Back', mobileOnly: true }}
        />

        <ProfileIdentityCard
          email={user.email ?? ''}
          memberSince={memberSince}
          firstName={firstName}
          lastName={lastName}
          onSettingsClick={() => navigate('/profile/settings')}
        />

        {message ? <p className="mb-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

        <ProfileLinkRows
          rows={[
            {
              id: 'friends',
              label: 'Friends',
              icon: 'friends',
              badge: pendingFriendCount,
              onClick: () => navigate('/profile/friends'),
            },
            {
              id: 'history',
              label: 'History',
              icon: 'history',
              onClick: () => navigate('/profile/history'),
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
              onClick: calendarConnected ? handleSyncCalendar : handleConnectCalendar,
              loading: calendarConnecting || calendarSyncing,
              disabled: calendarBusy || refreshing || exporting || clearing,
              showChevron: false,
            },
            ...(calendarConnected
              ? [
                  {
                    id: 'calendar-reset',
                    label: 'Reset & re-sync calendar',
                    icon: 'calendar' as const,
                    subtitle: 'Delete TimeTracker events and re-create with tag colors',
                    onClick: handleResetCalendar,
                    loading: calendarResetting,
                    disabled: calendarBusy || refreshing || exporting || clearing,
                    showChevron: false,
                  },
                  {
                    id: 'calendar-disconnect',
                    label: 'Disconnect Google Calendar',
                    icon: 'calendar' as const,
                    subtitle: 'Stop exporting sessions to Google',
                    onClick: handleDisconnectCalendar,
                    loading: calendarDisconnecting,
                    disabled: calendarBusy || refreshing || exporting || clearing,
                    showChevron: false,
                  },
                ]
              : []),
          ]}
        />

        <ProfileLinkRows
          rows={[
            {
              id: 'refresh',
              label: 'Refresh data',
              icon: 'sync',
              subtitle: lastRefreshedLabel,
              onClick: handleRefresh,
              loading: refreshing,
              disabled: accountBusy,
              showChevron: false,
            },
            {
              id: 'export',
              label: 'Export CSV',
              icon: 'export',
              onClick: handleExport,
              loading: exporting,
              disabled: accountBusy,
              showChevron: false,
            },
            {
              id: 'clear',
              label: 'Clear all data',
              icon: 'clear',
              variant: 'destructive',
              onClick: handleClear,
              loading: clearing,
              disabled: accountBusy,
              showChevron: false,
            },
            {
              id: 'delete-account',
              label: 'Delete account',
              icon: 'deleteAccount',
              variant: 'destructive',
              subtitle: 'Permanently remove your account and all data',
              onClick: () => {
                setError(null);
                setDeleteAccountOpen(true);
              },
              loading: deletingAccount,
              disabled: accountBusy,
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
              onClick: handleSignOut,
              disabled: deletingAccount,
              showChevron: false,
            },
          ]}
        />
      </div>

      <ProfileFooter />

      <DeleteAccountModal
        visible={deleteAccountOpen}
        onClose={() => {
          if (!deletingAccount) setDeleteAccountOpen(false);
        }}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
