import { useAppColors } from '@/contexts/ThemeContext';
import { formatDurationLong } from '@/utils/formatDuration';

interface StackSlice {
  value: number;
  durationMs: number;
  color: string;
}

interface StackedBar {
  label: string;
  totalMs: number;
  stacks: StackSlice[];
}

interface StackedBarChartProps {
  bars: StackedBar[];
}

export function StackedBarChart({ bars }: StackedBarChartProps) {
  const colors = useAppColors();
  const data = bars.filter((bar) => bar.stacks.length > 0);
  const maxTotal = Math.max(...data.map((bar) => bar.stacks.reduce((sum, stack) => sum + stack.value, 0)), 1);
  const chartHeight = 140;

  if (data.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 pt-2">
      {data.map((bar) => {
        const barTotal = bar.stacks.reduce((sum, stack) => sum + stack.value, 0);
        const barHeight = Math.max((barTotal / maxTotal) * chartHeight, 4);

        return (
          <div key={bar.label} className="flex flex-col items-center">
            <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
              {formatDurationLong(bar.totalMs)}
            </span>
            <div
              className="flex w-7 flex-col justify-end overflow-hidden rounded-t-md"
              style={{ height: barHeight }}
            >
              {bar.stacks.map((stack, index) => (
                <div
                  key={`${bar.label}-${index}`}
                  style={{
                    height: `${(stack.value / barTotal) * 100}%`,
                    backgroundColor: stack.color,
                    minHeight: stack.value > 0 ? 2 : 0,
                  }}
                />
              ))}
            </div>
            <span className="mt-2 text-xs" style={{ color: colors.textMuted }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
