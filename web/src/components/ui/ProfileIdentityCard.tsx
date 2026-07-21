import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
// import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { useAppColors } from '@/contexts/ThemeContext';

interface ProfileIdentityCardProps {
  email: string;
  memberSince?: string | null;
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  showThemeToggle?: boolean;
  saving?: boolean;
  disabled?: boolean;
}

function displayName(firstName: string, lastName: string): string | null {
  const full = `${firstName.trim()} ${lastName.trim()}`.trim();
  return full || null;
}

function avatarInitial(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

export function ProfileIdentityCard({
  email,
  memberSince,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  showThemeToggle = true,
  saving = false,
  disabled = false,
}: ProfileIdentityCardProps) {
  const colors = useAppColors();
  void showThemeToggle;
  const name = displayName(firstName, lastName);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const labelStyle = { color: colors.textMuted };

  return (
    <ThemedSurface className="mb-4 p-4">
      <div className="mb-4 flex items-start gap-3">
        <ProfileAvatar compact fallbackLabel={avatarInitial(firstName, lastName, email)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold" style={{ color: colors.textOnBg }}>
            {name ?? 'Add your name'}
          </p>
          <p className="mt-0.5 truncate text-xs" style={{ color: colors.textMuted }}>
            {email}
          </p>
          {memberSince ? (
            <p className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
              Member since {memberSince}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>
            First name
          </label>
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
            disabled={disabled}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{
              ...inputStyle,
              color: disabled ? colors.textDisabled : colors.text,
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>
            Last name
          </label>
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Doe"
            autoComplete="family-name"
            disabled={disabled}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{
              ...inputStyle,
              color: disabled ? colors.textDisabled : colors.text,
            }}
          />
        </div>
      </div>
      <p className="mt-2.5 text-xs" style={{ color: colors.textMuted }}>
        Friends see this name when you share stats.
        {saving ? <span> Saving…</span> : null}
      </p>
    </ThemedSurface>
  );
}
