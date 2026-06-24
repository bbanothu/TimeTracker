import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';

export function ChangePasswordPage() {
  const colors = useAppColors();
  const navigate = useNavigate();
  const { user, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Use at least 6 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a different password than your current one.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
      setTimeout(() => navigate('/profile'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/profile" className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          ← Account
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: colors.headerText }}>
          Password
        </h1>
        <span className="w-16" />
      </div>

      <ThemedSurface className="mb-4 p-4">
        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Enter your current password, then choose a new one.
        </p>
        {message ? <p className="mb-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <ActionButton
            label="Update password"
            type="submit"
            loading={saving}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          />
        </form>
      </ThemedSurface>
    </div>
  );
}
