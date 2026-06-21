import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
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
    <View className="mb-4">
      <Text
        className="mb-2 text-sm font-semibold uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        Visualization
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <View
          className="flex-row rounded-xl p-1"
          style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 }}
        >
          {OPTIONS.map((item) => {
            const selected = visualization === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => onChange(item.value)}
                className="rounded-lg px-3 py-2"
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
      </ScrollView>
    </View>
  );
}
