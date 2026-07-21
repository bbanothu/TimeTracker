import { NavLink } from 'react-router-dom';

import { NavIcon } from '@/components/layout/NavIcon';
import { mainNavTabs } from '@/config/nav';
import { useAppColors } from '@/contexts/ThemeContext';

export function TabNav() {
  const colors = useAppColors();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div
        className="pointer-events-auto mx-auto flex max-w-lg overflow-hidden rounded-full border shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        style={{
          backgroundColor: colors.tabBarBg,
          borderColor: colors.tabBarBorder,
        }}
      >
        {mainNavTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[10px] font-semibold transition"
            style={({ isActive }) => ({
              color: isActive ? colors.tabActive : colors.tabInactive,
            })}
          >
            {({ isActive }) => (
              <>
                <NavIcon
                  name={tab.icon}
                  color={isActive ? colors.tabActive : colors.tabInactive}
                  active={isActive}
                />
                <span className="truncate">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
