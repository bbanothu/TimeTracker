import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';

interface LegalPageLayoutProps {
  title: string;
  updated?: string;
  backLink?: { to: string; label: string } | null;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  updated,
  backLink = { to: '/profile', label: '← Account' },
  children,
}: LegalPageLayoutProps) {
  const colors = useAppColors();

  return (
    <div>
      <PageHeader
        title={title}
        backLink={backLink ?? undefined}
        showMobileActions={false}
      />
      <ThemedSurface className="p-5 lg:p-6">
        {updated ? (
          <p className="mb-5 text-sm" style={{ color: colors.textMuted }}>
            Last updated: {updated}
          </p>
        ) : null}
        <div className="space-y-5 text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          {children}
        </div>
      </ThemedSurface>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  const colors = useAppColors();

  return (
    <section>
      <h2 className="mb-2 text-base font-semibold" style={{ color: colors.text }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
