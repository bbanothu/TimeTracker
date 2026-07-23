import { NavLink } from 'react-router-dom';

import { AccountNavLink } from '@/components/layout/AccountNavLink';
import { NavIcon, type NavIconName } from '@/components/layout/NavIcon';
import { mainNavTabs } from '@/config/nav';
import { useAppColors } from '@/contexts/ThemeContext';

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: NavIconName;
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
      {({ isActive }) => (
        <>
          <NavIcon
            name={icon}
            size={20}
            color={isActive ? colors.selectedText : colors.textMuted}
            active={isActive}
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function DesktopSidebar() {
  const colors = useAppColors();

  return (
    <aside
      className="hidden h-full w-60 shrink-0 flex-col border-r backdrop-blur-xl lg:flex"
      style={{
        backgroundColor: colors.tabBarBg,
        borderColor: colors.tabBarBorder,
      }}
    >
      <div className="shrink-0 px-5 pb-3 pt-5">
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

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-2">
        {mainNavTabs.map((tab) => (
          <NavItem
            key={tab.to}
            to={tab.to}
            label={tab.label}
            icon={tab.icon}
            end={tab.to === '/'}
          />
        ))}
      </nav>

      <div
        className="flex shrink-0 items-center gap-2  px-3 py-3"
        style={{ borderColor: colors.tabBarBorder }}
      >
        <div className="min-w-0 flex-1">
          <AccountNavLink />
        </div>
      </div>
    </aside>
  );
}
