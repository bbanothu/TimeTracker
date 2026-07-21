import type { ReactNode } from 'react';

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pt-6 lg:mx-0 lg:max-w-none lg:px-8 lg:pt-8 ${className ?? 'pb-28 lg:pb-8'}`}
    >
      {children}
    </div>
  );
}
