import { useAppColors } from '@/contexts/ThemeContext';

interface DonutSlice {
  color: string;
  durationMs: number;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
}

function buildConicGradient(slices: DonutSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.durationMs, 0) || 1;
  let angle = 0;

  const stops = slices.map((slice) => {
    const sweep = (slice.durationMs / total) * 360;
    const start = angle;
    angle += sweep;
    return `${slice.color} ${start}deg ${angle}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export function DonutChart({ slices, size = 180 }: DonutChartProps) {
  const colors = useAppColors();
  const innerSize = Math.round(size * 0.61);

  if (slices.length === 0) return null;

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: buildConicGradient(slices),
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: innerSize,
          height: innerSize,
          top: (size - innerSize) / 2,
          left: (size - innerSize) / 2,
          backgroundColor: colors.surface,
        }}
      />
    </div>
  );
}
