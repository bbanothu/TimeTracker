import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';

export const MOBILE_HEADER_CONTROL_SIZE = 52;

function DefaultMobileHeaderActions() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <Link to="/profile" aria-label="Account">
        <ProfileAvatar
          compact
          editable={false}
          fallbackLabel={(user.email?.[0] ?? '?').toUpperCase()}
        />
      </Link>
      <DarkModeToggle size={MOBILE_HEADER_CONTROL_SIZE} />
    </>
  );
}

export function PageHeader({
  title,
  actions,
  showMobileActions = true,
}: {
  title: string;
  actions?: ReactNode;
  showMobileActions?: boolean;
}) {
  const colors = useAppColors();
  const mobileActions = showMobileActions ? (actions ?? <DefaultMobileHeaderActions />) : actions;

  return (
    <div className="mb-4 flex items-center justify-between lg:mb-6">
      <h1 className="text-2xl font-bold lg:text-3xl" style={{ color: colors.headerText }}>
        {title}
      </h1>
      {mobileActions ? <div className="flex items-center gap-2 lg:hidden">{mobileActions}</div> : null}
    </div>
  );
}
