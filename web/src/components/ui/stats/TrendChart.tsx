import { useAppColors } from '@/contexts/ThemeContext';
import type { BucketDuration } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';

interface TrendChartProps {
  buckets: BucketDuration[];
  height?: number;
}

export function TrendChart({ buckets, height = 220 }: TrendChartProps) {
  const colors = useAppColors();
  const data = buckets.filter((bucket) => bucket.durationMs >= 0);

  if (data.length === 0) return null;

  const maxMs = Math.max(...data.map((bucket) => bucket.durationMs), 1);
  const chartHeight = height - 52;
  const width = Math.max(data.length * 56, 280);
  const leftPad = 32;
  const rightPad = 32;
  const topPad = 24;
  const plotWidth = width - leftPad - rightPad;

  const points = data.map((bucket, index) => {
    const x =
      data.length === 1
        ? leftPad + plotWidth / 2
        : leftPad + (index / (data.length - 1)) * plotWidth;
    const y = topPad + chartHeight - (bucket.durationMs / maxMs) * chartHeight;
    return { x, y, bucket };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const baseline = topPad + chartHeight;
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      <path d={areaPath} fill={colors.chartPrimary} fillOpacity={0.12} />
      <path d={linePath} fill="none" stroke={colors.chartPrimary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map(({ x, y, bucket }) => (
        <g key={bucket.label}>
          <circle cx={x} cy={y} r={4} fill={colors.chartPrimary} />
          <text x={x} y={y - 10} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
            {formatDurationLong(bucket.durationMs)}
          </text>
          <text x={x} y={height - 8} textAnchor="middle" fontSize={10} fill={colors.textMuted}>
            {bucket.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
