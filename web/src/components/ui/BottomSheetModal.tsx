import type { ReactNode } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';

interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  headerLeading?: ReactNode;
  headerActions?: ReactNode;
  maxHeightFraction?: number;
  panelClassName?: string;
  zIndexClass?: string;
}

export function BottomSheetScroll({
  maxHeightFraction = 0.6,
  heightCapRem = 28,
  children,
  className = '',
}: {
  maxHeightFraction?: number;
  /** Max scroll height in rem; pass null to disable the cap. */
  heightCapRem?: number | null;
  children: ReactNode;
  className?: string;
}) {
  const viewportHeight = `calc(${Math.round(maxHeightFraction * 100)}vh - 8rem)`;
  const maxHeight =
    heightCapRem == null ? viewportHeight : `min(${viewportHeight}, ${heightCapRem}rem)`;

  return (
    <div className={`overflow-y-auto ${className}`} style={{ maxHeight }}>
      {children}
    </div>
  );
}

export function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
  headerLeading,
  headerActions,
  maxHeightFraction = 0.6,
  panelClassName = 'sm:max-w-md',
  zIndexClass = 'z-50',
}: BottomSheetModalProps) {
  const colors = useAppColors();

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex flex-col justify-end sm:justify-center sm:p-4`}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        style={{ backgroundColor: colors.overlay }}
        onClick={onClose}
      />
      <ThemedSurface
        className={`relative w-full rounded-t-3xl pb-8 sm:mx-auto sm:rounded-3xl ${panelClassName}`}
        style={{
          backgroundColor: colors.surfaceSolid,
          borderColor: colors.surfaceBorder,
          maxHeight: `${Math.round(maxHeightFraction * 100)}vh`,
        }}
      >
        <div className="px-4 pb-2 pt-3">
          <div className="mb-3 flex justify-center sm:hidden">
            <div
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: colors.textMuted, opacity: 0.45 }}
            />
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {headerLeading}
              <h3 className="truncate text-lg font-semibold" style={{ color: colors.text }}>
                {title}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1"
              >
                <span style={{ color: colors.textMuted }}>✕</span>
              </button>
            </div>
          </div>
        </div>
        <div className="px-4">{children}</div>
      </ThemedSurface>
    </div>
  );
}
