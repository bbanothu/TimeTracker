import { useAppColors } from '@/contexts/ThemeContext';
import { chartYAxisTicks } from '@/utils/chartUtils';
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
  chartHeight?: number;
}

export function StackedBarChart({ bars, chartHeight = 140 }: StackedBarChartProps) {
  const colors = useAppColors();
  const data = bars.filter((bar) => bar.stacks.length > 0);
  const maxTotalMs = Math.max(
    ...data.map((bar) => bar.stacks.reduce((sum, stack) => sum + stack.durationMs, 0)),
    1,
  );
  const yTicks = chartYAxisTicks(maxTotalMs, 4);

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
        {data.map((bar) => {
          const barTotalMs = bar.stacks.reduce((sum, stack) => sum + stack.durationMs, 0);
          const barHeight = Math.max((barTotalMs / maxTotalMs) * chartHeight, 4);

          return (
            <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center">
              <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                {formatDurationLong(bar.totalMs)}
              </span>
              <div
                className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md lg:max-w-12"
                style={{ height: barHeight }}
              >
                {bar.stacks.map((stack, index) => (
                  <div
                    key={`${bar.label}-${index}`}
                    style={{
                      height: `${(stack.durationMs / barTotalMs) * 100}%`,
                      backgroundColor: stack.color,
                      minHeight: stack.durationMs > 0 ? 2 : 0,
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
    </div>
  );
}
