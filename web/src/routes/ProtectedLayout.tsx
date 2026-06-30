import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppBootSplash } from '@/components/layout/AppBootSplash';
import { AppShell } from '@/components/layout/AppShell';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopTopBar, DESKTOP_TOP_BAR_PADDING_CLASS } from '@/components/layout/DesktopTopBar';
import { TabNav } from '@/components/layout/TabNav';
import { useAuth } from '@/contexts/AuthContext';
import { AppDataProviders } from '@/routes/AppDataProviders';

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hideTabNav = location.pathname.startsWith('/profile');

  if (loading) {
    return (
      <AppBackground>
        <div
          className={`min-h-dvh w-full lg:h-dvh lg:overflow-hidden lg:pl-60 ${DESKTOP_TOP_BAR_PADDING_CLASS}`}
        >
          <DesktopTopBar />
          <DesktopSidebar />
          <AppShell>
            <AppBootSplash />
          </AppShell>
        </div>
      </AppBackground>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppDataProviders>
      <AppBackground>
        <div
          className={`min-h-dvh w-full lg:h-dvh lg:overflow-hidden lg:pl-60 ${DESKTOP_TOP_BAR_PADDING_CLASS}`}
        >
          <DesktopTopBar />
          <DesktopSidebar />
          <AppShell className={hideTabNav ? 'pb-10 lg:pb-8' : undefined}>
            <Outlet />
          </AppShell>
        </div>
        {hideTabNav ? null : <TabNav />}
      </AppBackground>
    </AppDataProviders>
  );
}
