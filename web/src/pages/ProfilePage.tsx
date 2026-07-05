import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileIdentityCard } from '@/components/ui/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ui/ProfileLinkRows';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
// import { useAppColors } from '@/contexts/ThemeContext';
import { notifyDataRefresh } from '@/lib/dataRefresh';
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

export function ProfilePage() {
  // const colors = useAppColors();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { refreshAll, refreshing } = useRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
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
    fetchIncomingPendingCount().then(setPendingFriendCount).catch(console.error);
  }, []);

  useEffect(() => {
    if (location.pathname === '/profile') {
      loadPendingCount();
      reloadProfile().catch(console.error);
    }
  }, [location.pathname, loadPendingCount, reloadProfile]);

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
    <div>
      <PageHeader title="Account" backLink={{ to: '/', label: '← Back' }} />

      <ProfileIdentityCard
        email={user.email ?? ''}
        memberSince={memberSince}
        firstName={firstName}
        lastName={lastName}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        saving={profileSaving}
        disabled={profileLoading}
      />

      {profileError ? <p className="mb-3 text-sm text-rose-500">{profileError}</p> : null}
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
          {
            id: 'password',
            label: 'Password',
            icon: 'password',
            onClick: () => navigate('/profile/password'),
          },
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
            disabled: refreshing || exporting || clearing,
            showChevron: false,
          },
          {
            id: 'export',
            label: 'Export CSV',
            icon: 'export',
            onClick: handleExport,
            loading: exporting,
            disabled: refreshing || exporting || clearing,
            showChevron: false,
          },
          {
            id: 'clear',
            label: 'Clear all data',
            icon: 'clear',
            variant: 'destructive',
            onClick: handleClear,
            loading: clearing,
            disabled: refreshing || exporting || clearing,
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
            showChevron: false,
          },
        ]}
      />
    </div>
  );
}
