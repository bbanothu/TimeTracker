import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { AccountNavLink } from '@/components/layout/AccountNavLink';
import { useAppColors } from '@/contexts/ThemeContext';

export const DESKTOP_TOP_BAR_CLASS = 'top-[4.5rem]';
export const DESKTOP_TOP_BAR_PADDING_CLASS = 'lg:pt-[4.5rem]';

export function DesktopTopBar() {
  const colors = useAppColors();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 hidden h-[4.5rem] items-center justify-between border-b px-6 backdrop-blur-md lg:flex"
      style={{
        backgroundColor: colors.tabBarBg,
        borderColor: colors.tabBarBorder,
      }}
    >
      <div className="min-w-0">
        <p
          className="text-lg font-bold leading-tight tracking-tight"
          style={{ color: colors.headerText }}
        >
          TimeTracker
        </p>
        <p className="mt-0.5 text-xs leading-tight" style={{ color: colors.textMuted }}>
          Track time your way
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <AccountNavLink />
        <DarkModeToggle size={40} />
      </div>
    </header>
  );
}
