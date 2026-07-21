import { useAppColors } from '@/contexts/ThemeContext';
import type { BucketDuration } from '@/types';
import { chartYAxisTicks } from '@/utils/chartUtils';
import { formatDurationLong } from '@/utils/formatDuration';

interface BucketBarChartProps {
  buckets: BucketDuration[];
  chartHeight?: number;
}

const BAR_SLOT = 48;

export function BucketBarChart({ buckets, chartHeight = 140 }: BucketBarChartProps) {
  const colors = useAppColors();
  const data = buckets.filter((bucket) => bucket.durationMs > 0);
  const maxMs = Math.max(...data.map((bucket) => bucket.durationMs), 1);
  const yTicks = chartYAxisTicks(maxMs, 4);

  if (data.length === 0) return null;

  const trackWidth = data.length * BAR_SLOT;

  return (
    <div className="flex gap-3 pt-2">
      <div
        className="flex shrink-0 flex-col justify-between pb-6"
        style={{ height: chartHeight + 28 }}
      >
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
      <div className="min-w-0 flex-1 overflow-x-auto pb-1">
        <div
          className="flex items-end justify-start gap-3 lg:gap-5"
          style={{ minWidth: trackWidth, height: chartHeight + 28 }}
        >
          {data.map((bucket) => {
            const barHeight = Math.max((bucket.durationMs / maxMs) * chartHeight, 4);

            return (
              <div key={bucket.label} className="flex w-10 shrink-0 flex-col items-center lg:w-12">
                <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {formatDurationLong(bucket.durationMs)}
                </span>
                <div
                  className="w-full rounded-t-md"
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
    </div>
  );
}
