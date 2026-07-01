import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
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
  backLink,
  description,
  className = '',
}: {
  title: string;
  actions?: ReactNode;
  showMobileActions?: boolean;
  backLink?: { to: string; label: string };
  description?: ReactNode;
  className?: string;
}) {
  const colors = useAppColors();
  const mobileActions =
    !backLink && showMobileActions ? (actions ?? <DefaultMobileHeaderActions />) : actions;
  const titleClass = 'text-2xl font-bold lg:text-3xl';

  return (
    <ThemedSurface className={`mb-4 p-4 lg:mb-6 lg:p-5 ${className}`}>
      {backLink ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Link
            to={backLink.to}
            className="text-sm font-semibold"
            style={{ color: colors.textMuted }}
          >
            {backLink.label}
          </Link>
          <h1 className={`${titleClass} text-center`} style={{ color: colors.headerText }}>
            {title}
          </h1>
          <span aria-hidden="true" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <h1 className={titleClass} style={{ color: colors.headerText }}>
            {title}
          </h1>
          {mobileActions ? (
            <div className="flex shrink-0 items-center gap-2 lg:hidden">{mobileActions}</div>
          ) : null}
        </div>
      )}
      {description ? <div className="mt-3">{description}</div> : null}
    </ThemedSurface>
  );
}
