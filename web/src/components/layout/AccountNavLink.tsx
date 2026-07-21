import { NavLink } from 'react-router-dom';

import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useProfileName } from '@/hooks/useProfileName';
import { buildProfileDisplayName } from '@/services/profileService';

function avatarInitial(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

export function AccountNavLink() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { firstName, lastName } = useProfileName();

  if (!user) return null;

  const email = user.email ?? '';
  const label = buildProfileDisplayName({ firstName, lastName }) ?? email;

  return (
    <NavLink
      to="/profile"
      aria-label="Account"
      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1 transition hover:opacity-90"
      style={({ isActive }) => ({
        backgroundColor: isActive ? colors.selectedBgSolid : 'transparent',
      })}
    >
      <ProfileAvatar
        size={36}
        editable={false}
        fallbackLabel={avatarInitial(firstName, lastName, email)}
      />
      <span className="min-w-0 truncate text-sm font-medium" style={{ color: colors.text }}>
        {label}
      </span>
    </NavLink>
  );
}
