import type { ReactNode } from 'react';

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-6 lg:mx-0 lg:h-dvh lg:max-w-none lg:min-h-0 lg:min-w-0 lg:overflow-x-hidden lg:overflow-y-auto lg:px-8 lg:pt-8 ${className ?? 'pb-24 lg:pb-8'}`}
    >
      {children}
    </div>
  );
}
