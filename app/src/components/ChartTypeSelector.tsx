import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import type { PeriodType, StatsVisualization } from '@/types';

interface ChartTypeSelectorProps {
  period: PeriodType;
  visualization: StatsVisualization;
  onChange: (visualization: StatsVisualization) => void;
}

const ALL_OPTIONS: { value: StatsVisualization; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  // { value: 'bars', label: 'Bars' },
  { value: 'list', label: 'List' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'trend', label: 'Trend' },
];

export function ChartTypeSelector({ period, visualization, onChange }: ChartTypeSelectorProps) {
  const colors = useAppColors();
  const options =
    period === 'day' ? ALL_OPTIONS.filter((item) => item.value !== 'trend') : ALL_OPTIONS;

  return (
    <View className="mb-4">
      <Text
        className="mb-2 text-sm font-semibold uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        Visualization
      </Text>
      <View
        className="flex-row rounded-xl p-1"
        style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 }}
      >
        {options.map((item) => {
          const selected = visualization === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              className="flex-1 rounded-lg py-2"
              style={{ backgroundColor: selected ? colors.selectedBg : 'transparent' }}
            >
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: selected ? colors.selectedText : colors.textMuted }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
