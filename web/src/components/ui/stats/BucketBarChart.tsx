import { useAppColors } from '@/contexts/ThemeContext';
import type { BucketDuration } from '@/types';
import { chartYAxisTicks } from '@/utils/chartUtils';
import { formatDurationLong } from '@/utils/formatDuration';

interface BucketBarChartProps {
  buckets: BucketDuration[];
  chartHeight?: number;
}

export function BucketBarChart({ buckets, chartHeight = 140 }: BucketBarChartProps) {
  const colors = useAppColors();
  const data = buckets.filter((bucket) => bucket.durationMs > 0);
  const maxMs = Math.max(...data.map((bucket) => bucket.durationMs), 1);
  const yTicks = chartYAxisTicks(maxMs, 4);

  if (data.length === 0) return null;

  return (
    <div className="flex gap-3 pt-2">
      <div className="flex flex-col justify-between pb-6" style={{ height: chartHeight + 28 }}>
        {[...yTicks].reverse().map((tickMs) => (
          <span
            key={tickMs}
            className="text-right text-[11px] leading-none"
            style={{ color: colors.textMuted }}
          >
            {formatDurationLong(tickMs)}
          </span>
        ))}
      </div>
      <div className="flex flex-1 items-end justify-center gap-3 lg:gap-5">
        {data.map((bucket) => {
          const barHeight = Math.max((bucket.durationMs / maxMs) * chartHeight, 4);

          return (
            <div key={bucket.label} className="flex min-w-0 flex-1 flex-col items-center">
              <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                {formatDurationLong(bucket.durationMs)}
              </span>
              <div
                className="w-full max-w-10 rounded-t-md lg:max-w-12"
                style={{
                  height: barHeight,
                  backgroundColor: colors.chartPrimary,
                }}
              />
              <span className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
