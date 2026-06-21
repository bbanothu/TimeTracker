import { useAppColors } from '@/contexts/ThemeContext';
import type { BucketDuration } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';

interface BucketBarChartProps {
  buckets: BucketDuration[];
}

export function BucketBarChart({ buckets }: BucketBarChartProps) {
  const colors = useAppColors();
  const data = buckets.filter((bucket) => bucket.durationMs > 0);
  const maxMs = Math.max(...data.map((bucket) => bucket.durationMs), 1);
  const chartHeight = 140;

  if (data.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 pt-2">
      {data.map((bucket) => {
        const barHeight = Math.max((bucket.durationMs / maxMs) * chartHeight, 4);

        return (
          <div key={bucket.label} className="flex flex-col items-center">
            <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
              {formatDurationLong(bucket.durationMs)}
            </span>
            <div
              className="w-6 rounded-t-md"
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
  );
}
