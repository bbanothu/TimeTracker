import type { ReactNode } from 'react';

import { useAppColors } from '@/contexts/ThemeContext';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const colors = useAppColors();

  return (
    <div className="mb-4 flex items-center justify-between lg:mb-6">
      <h1 className="text-2xl font-bold lg:text-3xl" style={{ color: colors.headerText }}>
        {title}
      </h1>
      {actions ? <div className="flex items-center gap-2 lg:hidden">{actions}</div> : null}
    </div>
  );
}
