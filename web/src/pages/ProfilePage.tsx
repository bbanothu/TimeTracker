import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppBackground } from '@/components/layout/AppBackground';
import { ActionButton } from '@/components/ui/ActionButton';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
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
  const { user, signOut, updateEmail, updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  if (!user) return <Navigate to="/login" replace />;

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const handleExport = async () => {
    try {
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
      const count = await deleteAllEntries(user.id);
      setMessage(`Removed ${count} entries.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleEmail = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await updateEmail(email);
      setMessage('Email updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
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
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <AppBackground>
      <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" style={{ color: colors.textMuted }}>
            ← Back
          </Link>
          <DarkModeToggle />
        </div>

        <ThemedSurface className="mb-6 p-6 text-center">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: colors.selectedBg, color: colors.selectedText }}
          >
            {(user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <p className="text-lg font-semibold" style={{ color: colors.text }}>
            {user.email}
          </p>
        </ThemedSurface>

        {message ? <p className="mb-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

        <ThemedSurface className="mb-4 p-4">
          <h2 className="mb-3 font-semibold" style={{ color: colors.text }}>
            Account
          </h2>
          <form onSubmit={handleEmail} className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              style={inputStyle}
            />
            <ActionButton label="Save email" type="submit" className="w-full" />
          </form>
        </ThemedSurface>

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
    </AppBackground>
  );
}
