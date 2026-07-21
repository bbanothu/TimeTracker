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

const BAR_SLOT = 48;

export function StackedBarChart({ bars, chartHeight = 140 }: StackedBarChartProps) {
  const colors = useAppColors();
  const data = bars.filter((bar) => bar.stacks.length > 0);
  const maxTotalMs = Math.max(
    ...data.map((bar) => bar.stacks.reduce((sum, stack) => sum + stack.durationMs, 0)),
    1,
  );
  const yTicks = chartYAxisTicks(maxTotalMs, 4);

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
          {data.map((bar) => {
            const barTotalMs = bar.stacks.reduce((sum, stack) => sum + stack.durationMs, 0);
            const barHeight = Math.max((barTotalMs / maxTotalMs) * chartHeight, 4);

            return (
              <div key={bar.label} className="flex w-10 shrink-0 flex-col items-center lg:w-12">
                <span className="mb-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {formatDurationLong(bar.totalMs)}
                </span>
                <div
                  className="flex w-full flex-col justify-end overflow-hidden rounded-t-md"
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
    </div>
  );
}
