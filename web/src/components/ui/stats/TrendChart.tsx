import { useEffect, useRef, useState } from 'react';

import { useAppColors } from '@/contexts/ThemeContext';
import type { BucketDuration } from '@/types';
import { chartYAxisTicks } from '@/utils/chartUtils';
import { formatDurationLong } from '@/utils/formatDuration';

interface TrendChartProps {
  buckets: BucketDuration[];
  className?: string;
  minHeight?: number;
}

export function TrendChart({ buckets, className = '', minHeight = 220 }: TrendChartProps) {
  const colors = useAppColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: minHeight });
  const data = buckets.filter((bucket) => bucket.durationMs >= 0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [minHeight]);

  if (data.length === 0) return null;

  const width = Math.max(size.width, 280);
  const height = Math.max(size.height, minHeight);
  const bottomPad = 36;
  const topPad = 28;
  const leftPad = 56;
  const rightPad = 24;
  const chartHeight = height - topPad - bottomPad;
  const plotWidth = width - leftPad - rightPad;
  const maxMs = Math.max(...data.map((bucket) => bucket.durationMs), 1);
  const yTicks = chartYAxisTicks(maxMs, 4);
  const pointRadius = width > 700 ? 5 : 4;
  const strokeWidth = width > 700 ? 3.5 : 3;

  const points = data.map((bucket, index) => {
    const x =
      data.length === 1
        ? leftPad + plotWidth / 2
        : leftPad + (index / (data.length - 1)) * plotWidth;
    const y = topPad + chartHeight - (bucket.durationMs / maxMs) * chartHeight;
    return { x, y, bucket };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const baseline = topPad + chartHeight;
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  return (
    <div ref={containerRef} className={`w-full ${className}`} style={{ minHeight }}>
      {size.width > 0 ? (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full"
          role="img"
          aria-label="Tracked time trend"
        >
          {yTicks.map((tickMs) => {
            const y = topPad + chartHeight - (tickMs / maxMs) * chartHeight;
            return (
              <g key={tickMs}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={leftPad + plotWidth}
                  y2={y}
                  stroke={colors.surfaceBorder}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="4 4"
                />
                <text
                  x={leftPad - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={12}
                  fill={colors.textMuted}
                >
                  {formatDurationLong(tickMs)}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill={colors.chartPrimary} fillOpacity={0.12} />
          <path
            d={linePath}
            fill="none"
            stroke={colors.chartPrimary}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map(({ x, y, bucket }) => (
            <g key={bucket.label}>
              <circle
                cx={x}
                cy={y}
                r={pointRadius}
                fill={colors.chartPrimary}
                vectorEffect="non-scaling-stroke"
              />
              <text x={x} y={y - 12} textAnchor="middle" fontSize={12} fill={colors.textSecondary}>
                {formatDurationLong(bucket.durationMs)}
              </text>
              <text x={x} y={height - 10} textAnchor="middle" fontSize={12} fill={colors.textMuted}>
                {bucket.label}
              </text>
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
