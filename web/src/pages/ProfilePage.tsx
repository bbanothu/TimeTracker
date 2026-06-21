import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ActionButton } from '@/components/ui/ActionButton';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
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

export function ProfilePage() {
  const colors = useAppColors();
  const navigate = useNavigate();
  const { user, signOut, updatePassword } = useAuth();
  const { refreshAll, refreshing } = useRefresh();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

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

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setError(null);
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
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
        <DarkModeToggle />
      </div>

      <ThemedSurface className="mb-4 px-3 py-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            compact
            fallbackLabel={(user.email?.[0] ?? '?').toUpperCase()}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: colors.textOnBg }}>
              {user.email}
            </p>
            {memberSince ? (
              <p className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
                Member since {memberSince}
              </p>
            ) : null}
          </div>
        </div>
      </ThemedSurface>

      {message ? <p className="mb-3 text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-3 font-semibold" style={{ color: colors.text }}>
          Password
        </h2>
        <form onSubmit={handlePassword} className="space-y-3">
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            type="password"
            className="w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            type="password"
            className="w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <ActionButton label="Update password" type="submit" className="w-full" />
        </form>
      </ThemedSurface>

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
