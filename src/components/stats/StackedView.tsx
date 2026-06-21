import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { buildStackData, hasBucketData } from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { useTheme } from '@/hooks/useTheme';
import type { StatsSummary } from '@/types';

interface StackedViewProps {
  summary: StatsSummary;
}

export function StackedView({ summary }: StackedViewProps) {
  const { isDark } = useTheme();
  const stackData = buildStackData(summary).filter((item) => item.stacks.length > 0);
  const maxStackTotal = Math.max(
    ...stackData.map((item) => item.stacks.reduce((sum, stack) => sum + stack.value, 0)),
    60,
  );
  const chartTextColor = isDark ? '#CBD5E1' : '#64748B';

  return (
    <View className="mb-8 rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        Tag mix over time
      </Text>
      {!hasBucketData(summary) || stackData.length === 0 ? (
        <Text className="text-center text-slate-500 dark:text-slate-400">No data for this period</Text>
      ) : (
        <>
          <BarChart
            stackData={stackData}
            barWidth={28}
            spacing={18}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={maxStackTotal}
            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
          />
          <TagLegend items={summary.byTag} compact />
        </>
      )}
    </View>
  );
}
