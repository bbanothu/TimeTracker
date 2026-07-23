import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useProfileName } from '@/hooks/useProfileName';

export function SettingsPage() {
  const colors = useAppColors();
  const { user, updatePassword } = useAuth();
  const {
    firstName,
    lastName,
    setFirstName,
    setLastName,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
  } = useProfileName();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const labelStyle = { color: colors.textMuted };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Use at least 6 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Choose a different password than your current one.');
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError(null);
      setPasswordMessage(null);
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" backLink={{ to: '/profile', label: '← Account' }} />

      <h2 className="mb-2 text-base font-semibold" style={{ color: colors.textOnBg }}>
        Name
      </h2>
      <ThemedSurface className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
              disabled={profileLoading}
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{
                ...inputStyle,
                color: profileLoading ? colors.textDisabled : colors.text,
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>
              Last name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              autoComplete="family-name"
              disabled={profileLoading}
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{
                ...inputStyle,
                color: profileLoading ? colors.textDisabled : colors.text,
              }}
            />
          </div>
        </div>
        <p className="mt-2.5 text-xs" style={{ color: colors.textMuted }}>
          Friends see this name when you share stats.
          {profileSaving ? <span> Saving…</span> : null}
        </p>
        {profileError ? <p className="mt-2 text-sm text-rose-500">{profileError}</p> : null}
      </ThemedSurface>

      <h2 className="mb-2 text-base font-semibold" style={{ color: colors.textOnBg }}>
        Password
      </h2>
      <ThemedSurface className="mb-4 p-4">
        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Enter your current password, then choose a new one.
        </p>
        {passwordMessage ? (
          <p className="mb-3 text-sm text-emerald-600">{passwordMessage}</p>
        ) : null}
        {passwordError ? <p className="mb-3 text-sm text-rose-500">{passwordError}</p> : null}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
            loading={savingPassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          />
        </form>
      </ThemedSurface>
    </div>
  );
}
