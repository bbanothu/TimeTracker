import { useAppColors } from '@/contexts/ThemeContext';
import type { StatsVisualization } from '@/types';

interface ChartTypeSelectorProps {
  visualization: StatsVisualization;
  onChange: (visualization: StatsVisualization) => void;
}

const OPTIONS: { value: StatsVisualization; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  // { value: 'bars', label: 'Bars' },
  { value: 'list', label: 'List' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'trend', label: 'Trend' },
];

export function ChartTypeSelector({ visualization, onChange }: ChartTypeSelectorProps) {
  const colors = useAppColors();

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
        Visualization
      </p>
      <div
        className="inline-flex overflow-x-auto rounded-xl border p-1"
        style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}
      >
        {OPTIONS.map((item) => {
          const selected = visualization === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold"
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
