import { Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import {
  buildBucketLineData,
  buildPieData,
  buildTagBarData,
  hasBucketData,
  hasTagData,
  toChartMinutes,
} from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { useTheme } from '@/hooks/useTheme';
import type { StatsSummary } from '@/types';

interface ChartViewProps {
  summary: StatsSummary;
}

export function OverviewView({ summary }: ChartViewProps) {
  const { isDark } = useTheme();
  const pieData = buildPieData(summary);
  const barData = summary.buckets.map((bucket) => ({
    value: toChartMinutes(bucket.durationMs),
    label: bucket.label,
    frontColor: '#3B82F6',
  }));
  const chartTextColor = isDark ? '#CBD5E1' : '#64748B';
  const pieLabelColor = isDark ? '#E2E8F0' : '#334155';

  return (
    <>
      <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Time by tag
        </Text>
        {!hasTagData(summary) ? (
          <Text className="text-center text-slate-500 dark:text-slate-400">No data for this period</Text>
        ) : (
          <View className="items-center">
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
              showText
              textColor={pieLabelColor}
              textSize={11}
            />
            <TagLegend items={summary.byTag} />
          </View>
        )}
      </View>

      <View className="mb-8 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          {summary.buckets.length > 1 ? 'Breakdown' : 'Daily total'}
        </Text>
        {!hasBucketData(summary) ? (
          <Text className="text-center text-slate-500 dark:text-slate-400">No breakdown data</Text>
        ) : (
          <BarChart
            data={barData}
            barWidth={22}
            spacing={18}
            roundedTop
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(...barData.map((item) => item.value), 60)}
            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
          />
        )}
      </View>
    </>
  );
}

export function BarsView({ summary }: ChartViewProps) {
  const { isDark } = useTheme();
  const tagBarData = buildTagBarData(summary);
  const lineData = buildBucketLineData(summary);
  const chartTextColor = isDark ? '#CBD5E1' : '#64748B';

  return (
    <>
      <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Time by tag
        </Text>
        {!hasTagData(summary) ? (
          <Text className="text-center text-slate-500 dark:text-slate-400">No data for this period</Text>
        ) : (
          <BarChart
            horizontal
            data={tagBarData}
            barWidth={18}
            spacing={14}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(...tagBarData.map((item) => item.value), 60)}
            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
          />
        )}
      </View>

      <View className="mb-8 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Trend
        </Text>
        {!hasBucketData(summary) ? (
          <Text className="text-center text-slate-500 dark:text-slate-400">No trend data</Text>
        ) : (
          <LineChart
            data={lineData}
            curved
            color="#2563EB"
            thickness={2}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(...lineData.map((item) => item.value), 60)}
            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
          />
        )}
      </View>
    </>
  );
}
