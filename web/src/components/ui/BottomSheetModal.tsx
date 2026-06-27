import type { ReactNode } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';

interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
  maxHeightFraction?: number;
}

export function BottomSheetScroll({
  maxHeightFraction = 0.6,
  children,
  className = '',
}: {
  maxHeightFraction?: number;
  children: ReactNode;
  className?: string;
}) {
  const maxHeight = `min(calc(${Math.round(maxHeightFraction * 100)}vh - 8rem), 28rem)`;

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
  headerActions,
  maxHeightFraction = 0.6,
}: BottomSheetModalProps) {
  const colors = useAppColors();

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        style={{ backgroundColor: colors.overlay }}
        onClick={onClose}
      />
      <ThemedSurface
        className="relative w-full rounded-t-3xl pb-8 sm:mx-auto sm:max-w-md sm:rounded-3xl"
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
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              {title}
            </h3>
            <div className="ml-3 flex items-center gap-1">
              {headerActions}
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1">
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
