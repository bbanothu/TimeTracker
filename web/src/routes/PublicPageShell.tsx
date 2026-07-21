import type { ReactNode } from 'react';

import { AppBackground } from '@/components/layout/AppBackground';
import { AppShell } from '@/components/layout/AppShell';

/** Minimal chrome for public legal/support pages (no auth required). */
export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <AppBackground>
      <div className="flex h-full w-full flex-col">
        <AppShell className="pb-10">{children}</AppShell>
      </div>
    </AppBackground>
  );
}
