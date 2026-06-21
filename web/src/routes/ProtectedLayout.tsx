import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppShell } from '@/components/layout/AppShell';
import { TabNav } from '@/components/layout/TabNav';
import { useAuth } from '@/contexts/AuthContext';
import { AppDataProviders } from '@/routes/AppDataProviders';

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hideTabNav = location.pathname === '/profile';

  if (loading) {
    return (
      <AppBackground>
        <AppShell>
          <p className="text-center text-stone-500">Loading…</p>
        </AppShell>
      </AppBackground>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppDataProviders>
      <AppBackground>
        <AppShell className={hideTabNav ? 'pb-10' : undefined}>
          <Outlet />
        </AppShell>
        {hideTabNav ? null : <TabNav />}
      </AppBackground>
    </AppDataProviders>
  );
}
