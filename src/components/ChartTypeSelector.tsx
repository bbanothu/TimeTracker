import { Pressable, ScrollView, Text, View } from 'react-native';

import type { StatsVisualization } from '@/types';

interface ChartTypeSelectorProps {
  visualization: StatsVisualization;
  onChange: (visualization: StatsVisualization) => void;
}

const OPTIONS: { value: StatsVisualization; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'bars', label: 'Bars' },
  { value: 'list', label: 'List' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'trend', label: 'Trend' },
];

export function ChartTypeSelector({ visualization, onChange }: ChartTypeSelectorProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Visualization
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {OPTIONS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              className={`rounded-lg px-3 py-2 ${
                visualization === item.value ? 'bg-white dark:bg-slate-900' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  visualization === item.value
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
