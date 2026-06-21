import type { ReactNode } from 'react';

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-6 ${className ?? 'pb-24'}`}>
      {children}
    </div>
  );
}
