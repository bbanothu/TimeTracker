import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppBootSplash } from '@/components/layout/AppBootSplash';
import { AppShell } from '@/components/layout/AppShell';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { TabNav } from '@/components/layout/TabNav';
import { useAuth } from '@/contexts/AuthContext';
import { AppDataProviders } from '@/routes/AppDataProviders';

function AppChrome({ children, hideTabNav }: { children: React.ReactNode; hideTabNav?: boolean }) {
  return (
    <div className="flex h-full w-full">
      <DesktopSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShell className={hideTabNav ? 'pb-10 lg:pb-8' : undefined}>{children}</AppShell>
      </div>
      {hideTabNav ? null : <TabNav />}
    </div>
  );
}

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hideTabNav = location.pathname.startsWith('/profile');

  if (loading) {
    return (
      <AppBackground>
        <AppChrome>
          <AppBootSplash />
        </AppChrome>
      </AppBackground>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppDataProviders>
      <AppBackground>
        <AppChrome hideTabNav={hideTabNav}>
          <Outlet />
        </AppChrome>
      </AppBackground>
    </AppDataProviders>
  );
}
