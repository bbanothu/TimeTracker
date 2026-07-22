import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
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
      {/* <DarkModeToggle size={MOBILE_HEADER_CONTROL_SIZE} /> */}
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
  backLink?: { to: string; label: string; mobileOnly?: boolean };
  description?: ReactNode;
  className?: string;
}) {
  const colors = useAppColors();
  const navigate = useNavigate();
  const mobileActions =
    !backLink && showMobileActions ? (actions ?? <DefaultMobileHeaderActions />) : actions;
  const titleClass = 'text-2xl font-semibold lg:text-3xl';
  const mobileOnlyBack = Boolean(backLink?.mobileOnly);

  return (
    <div className={`relative z-10 mb-4 p-4 lg:mb-6 lg:p-5 ${className}`}>
      {backLink ? (
        <>
          <div className={`flex items-center gap-1 ${mobileOnlyBack ? 'lg:hidden' : ''}`}>
            <button
              type="button"
              onClick={() => navigate(backLink.to)}
              className="-ml-2 min-h-11 min-w-11 shrink-0 rounded-lg px-2 py-2 text-left text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: colors.headerText }}
              aria-label={backLink.label}
            >
              {backLink.label}
            </button>
            <h1 className={`${titleClass} min-w-0 flex-1`} style={{ color: colors.headerText }}>
              {title}
            </h1>
          </div>
          {mobileOnlyBack ? (
            <div className="hidden lg:block">
              <h1 className={titleClass} style={{ color: colors.headerText }}>
                {title}
              </h1>
            </div>
          ) : null}
        </>
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
    </div>
  );
}
