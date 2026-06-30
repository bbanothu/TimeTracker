import { useMemo } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { useCountUpMs } from '@/hooks/useCountUpMs';
import { formatDurationLong } from '@/utils/formatDuration';
import { MAX_ACCOUNTED_DAY_MS, sumAccountedDurationMs } from '@/utils/goalProgress';

interface GoalsAccountedSummaryProps {
  progressByTagId: Map<string, number>;
}

export function GoalsAccountedSummary({ progressByTagId }: GoalsAccountedSummaryProps) {
  const colors = useAppColors();
  const accountedMs = useMemo(() => sumAccountedDurationMs(progressByTagId), [progressByTagId]);
  const displayMs = useCountUpMs(accountedMs);
  const fillRatio = accountedMs / MAX_ACCOUNTED_DAY_MS;

  return (
    <ThemedSurface className="mb-4 px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
          Accounted today
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: colors.textOnBg }}
        >
          {formatDurationLong(displayMs)}
        </span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: colors.surfaceBorder }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${Math.round(fillRatio * 100)}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      <p className="mt-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
        Across categories · max 24h per day
      </p>
    </ThemedSurface>
  );
}
