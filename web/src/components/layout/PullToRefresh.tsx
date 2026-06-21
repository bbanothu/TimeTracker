import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useRefresh } from '@/contexts/RefreshContext';
import { useAppColors } from '@/contexts/ThemeContext';

interface PullToRefreshProps {
  children: ReactNode;
}

const PULL_THRESHOLD = 72;

export function PullToRefresh({ children }: PullToRefreshProps) {
  const colors = useAppColors();
  const { refreshAll, refreshing } = useRefresh();
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(refreshing);

  refreshingRef.current = refreshing;

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current === null || window.scrollY > 0 || refreshingRef.current) return;
      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = Math.max(0, currentY - startYRef.current);
      pullDistanceRef.current = Math.min(delta, PULL_THRESHOLD + 16);
      setPullDistance(pullDistanceRef.current);
    };

    const onTouchEnd = () => {
      if (pullDistanceRef.current >= PULL_THRESHOLD && !refreshingRef.current) {
        refreshAll().catch(console.error);
      }
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [refreshAll]);

  const showIndicator = refreshing || pullDistance > 8;

  return (
    <>
      {showIndicator ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-2"
          style={{ transform: `translateY(${Math.min(pullDistance, PULL_THRESHOLD)}px)` }}
        >
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
            style={{ backgroundColor: colors.surfaceSolid, color: colors.textMuted }}
          >
            {refreshing ? 'Refreshing…' : 'Pull to refresh'}
          </span>
        </div>
      ) : null}
      {children}
    </>
  );
}
