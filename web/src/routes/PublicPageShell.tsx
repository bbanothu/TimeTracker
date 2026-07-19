import type { ReactNode } from 'react';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppShell } from '@/components/layout/AppShell';

/** Minimal chrome for public legal/support pages (no auth required). */
export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <AppBackground>
      <div className="min-h-dvh w-full">
        <AppShell className="pb-10">{children}</AppShell>
      </div>
    </AppBackground>
  );
}
