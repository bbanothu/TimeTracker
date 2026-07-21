import { Link } from 'react-router-dom';

import { useAppColors } from '@/contexts/ThemeContext';

const FOOTER_LINKS = [
  { to: '/profile/about', label: 'About' },
  { to: '/profile/contact', label: 'Contact' },
  { to: '/profile/support', label: 'Support' },
  { to: '/profile/privacy', label: 'Privacy' },
  { to: '/profile/terms', label: 'Terms' },
] as const;

export function ProfileFooter() {
  const colors = useAppColors();

  return (
    <footer
      className="mt-auto flex flex-col gap-4 border-t px-1 pb-6 pt-8 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: colors.surfaceBorder }}
    >
      <p className="text-sm" style={{ color: colors.textMuted }}>
        © {new Date().getFullYear()} QCSmallBusiness. All rights reserved.
      </p>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {FOOTER_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: colors.textSecondary }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
