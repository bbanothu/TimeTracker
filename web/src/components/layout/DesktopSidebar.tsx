import { NavLink } from 'react-router-dom';

import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { accountNavItem, mainNavTabs } from '@/config/nav';
import { useAppColors } from '@/contexts/ThemeContext';

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}) {
  const colors = useAppColors();

  return (
    <NavLink
      to={to}
      end={end}
      className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
      style={({ isActive }) => ({
        backgroundColor: isActive ? colors.selectedBgSolid : 'transparent',
        color: isActive ? colors.selectedText : colors.textMuted,
      })}
    >
      <span className="text-lg leading-none" aria-hidden>
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

export function DesktopSidebar() {
  const colors = useAppColors();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 flex-col border-r backdrop-blur-md lg:flex"
      style={{
        backgroundColor: colors.tabBarBg,
        borderColor: colors.tabBarBorder,
      }}
    >
      <div className="px-5 pb-2 pt-7">
        <p className="text-lg font-bold tracking-tight" style={{ color: colors.headerText }}>
          TimeTracker
        </p>
        <p className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
          Track time your way
        </p>
      </div>

      <nav className="flex-1 px-3 pt-4">
        {mainNavTabs.map((tab) => (
          <NavItem key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} end={tab.to === '/'} />
        ))}
        <div
          className="my-3 border-t"
          style={{ borderColor: colors.surfaceBorder }}
          role="presentation"
        />
        <NavItem
          to={accountNavItem.to}
          label={accountNavItem.label}
          icon={accountNavItem.icon}
        />
      </nav>

      <div
        className="flex items-center justify-between border-t px-5 py-4"
        style={{ borderColor: colors.surfaceBorder }}
      >
        <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
          Theme
        </span>
        <DarkModeToggle />
      </div>
    </aside>
  );
}
