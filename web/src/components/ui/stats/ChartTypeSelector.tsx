import { useAppColors } from '@/contexts/ThemeContext';
import type { PeriodType, StatsVisualization } from '@/types';

interface ChartTypeSelectorProps {
  period: PeriodType;
  visualization: StatsVisualization;
  onChange: (visualization: StatsVisualization) => void;
  className?: string;
}

const ALL_OPTIONS: { value: StatsVisualization; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  // { value: 'bars', label: 'Bars' },
  { value: 'list', label: 'List' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'history', label: 'History' },
  { value: 'trend', label: 'Trend' },
];

export function ChartTypeSelector({
  period,
  visualization,
  onChange,
  className = '',
}: ChartTypeSelectorProps) {
  const colors = useAppColors();
  const options = ALL_OPTIONS.filter((item) =>
    period === 'day' ? item.value !== 'trend' : item.value !== 'history',
  );

  return (
    <div className={`mb-4 lg:mb-5 ${className}`}>
      <p
        className="mb-2 text-sm font-semibold uppercase tracking-wide lg:sr-only"
        style={{ color: colors.textMuted }}
      >
        Visualization
      </p>
      <div
        className="flex flex-wrap gap-1 rounded-xl border p-1 lg:inline-flex"
        style={{
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        }}
      >
        {options.map((item) => {
          const selected = visualization === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className="rounded-lg px-3 py-2 text-sm font-semibold lg:px-5 lg:py-2.5"
              style={{
                backgroundColor: selected ? colors.selectedBg : 'transparent',
                color: selected ? colors.selectedText : colors.textMuted,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
