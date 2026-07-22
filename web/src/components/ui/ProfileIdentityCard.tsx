import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';

interface ProfileIdentityCardProps {
  email: string;
  memberSince?: string | null;
  firstName: string;
  lastName: string;
  onSettingsClick: () => void;
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

function SettingsIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIdentityCard({
  email,
  memberSince,
  firstName,
  lastName,
  onSettingsClick,
}: ProfileIdentityCardProps) {
  const colors = useAppColors();
  const name = displayName(firstName, lastName);

  return (
    <ThemedSurface className="mb-4 p-4">
      <div className="flex items-start gap-3">
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
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Settings"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition hover:opacity-90"
          style={{
            borderColor: colors.glassBorder,
            color: colors.text,
            backgroundColor: 'transparent',
          }}
        >
          <SettingsIcon color={colors.text} size={18} />
        </button>
      </div>
    </ThemedSurface>
  );
}
