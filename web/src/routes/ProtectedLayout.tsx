import { Navigate, Outlet } from 'react-router-dom';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppShell } from '@/components/layout/AppShell';
import { TabNav } from '@/components/layout/TabNav';
import { TagsProvider } from '@/contexts/TagsContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedLayout() {
  const { user, loading } = useAuth();

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
    <TagsProvider>
      <TimerProvider>
        <AppBackground>
          <AppShell>
            <Outlet />
          </AppShell>
          <TabNav />
        </AppBackground>
      </TimerProvider>
    </TagsProvider>
  );
}
