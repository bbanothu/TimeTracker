import { NavLink } from 'react-router-dom';

import { mainNavTabs } from '@/config/nav';
import { useAppColors } from '@/contexts/ThemeContext';

export function TabNav() {
  const colors = useAppColors();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-md lg:hidden"
      style={{ backgroundColor: colors.tabBarBg, borderColor: colors.tabBarBorder }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {mainNavTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className="flex flex-col items-center px-2 py-3 text-xs font-medium transition"
            style={({ isActive }) => ({
              color: isActive ? colors.tabActive : colors.tabInactive,
            })}
          >
            <span className="mb-1 text-lg">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
