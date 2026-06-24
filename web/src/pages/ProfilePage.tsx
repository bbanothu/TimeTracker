import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ActionButton } from '@/components/ui/ActionButton';
import { ProfileIdentityCard } from '@/components/ui/ProfileIdentityCard';
import { ProfileLinkRows } from '@/components/ui/ProfileLinkRows';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import {
  deleteAllEntries,
  downloadCsv,
  exportEntriesCsv,
  fetchAllEntries,
  fetchGeofences,
} from '@/services/data';
import { useProfileName } from '@/hooks/useProfileName';
import { fetchIncomingPendingCount } from '@/services/friendsService';

export function ProfilePage() {
  const colors = useAppColors();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { refreshAll, refreshing } = useRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      .catch(console.error);
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
      setMessage('Data refreshed from the cloud.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    }
  };

  const handleExport = async () => {
    try {
      setError(null);
      const [entries, geofences] = await Promise.all([
        fetchAllEntries(user.id),
        fetchGeofences(user.id),
      ]);
      const names = new Map(geofences.map((g) => [g.id, g.name]));
      const csv = exportEntriesCsv(entries, names);
      downloadCsv(`timetracker-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setMessage(`Downloaded ${entries.length} entries.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Delete all tracked time entries? This cannot be undone.')) return;
    try {
      setError(null);
      const count = await deleteAllEntries(user.id);
      notifyDataRefresh();
      setMessage(`Removed ${count} entries.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    }
  };

  const handleSignOut = async () => {
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          ← Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: colors.headerText }}>
          Account
        </h1>
        <span className="w-12" />
      </div>

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

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-3 font-semibold" style={{ color: colors.text }}>
          Data
        </h2>
        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Changes save to the cloud automatically. Pull down on any tab to refresh, or use Refresh
          data to load the latest from your other devices. You can also export tracked time or
          permanently remove all time entries.
        </p>
        <ActionButton
          label="Refresh data"
          onClick={handleRefresh}
          variant="secondary"
          loading={refreshing}
          disabled={refreshing}
          className="mb-4 w-full"
        />
        <div className="flex gap-3">
          <ActionButton label="Export CSV" onClick={handleExport} className="flex-1" />
          <ActionButton
            label="Clear all data"
            onClick={handleClear}
            variant="destructiveOutline"
            className="flex-1"
          />
        </div>
      </ThemedSurface>

      <ActionButton label="Sign out" onClick={handleSignOut} variant="destructiveOutline" className="w-full" />
    </div>
  );
}
