import { NavLink } from 'react-router-dom';

import { DESKTOP_TOP_BAR_CLASS } from '@/components/layout/DesktopTopBar';
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
      className={`fixed ${DESKTOP_TOP_BAR_CLASS} bottom-0 left-0 z-30 hidden w-60 flex-col border-r backdrop-blur-md lg:flex`}
      style={{
        backgroundColor: colors.tabBarBg,
        borderColor: colors.tabBarBorder,
      }}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
    </aside>
  );
}
