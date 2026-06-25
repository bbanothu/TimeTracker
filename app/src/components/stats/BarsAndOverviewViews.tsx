import { Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import {
  buildBucketLineData,
  buildPieData,
  buildTagBarData,
  chartYAxisProps,
  hasBucketData,
  hasTagData,
  toChartMinutes,
} from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { PeriodType, StatsSummary } from '@/types';

interface ChartViewProps {
  summary: StatsSummary;
}

export function OverviewView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const pieData = buildPieData(summary);
  const barData = summary.buckets.map((bucket) => ({
    value: toChartMinutes(bucket.durationMs),
    label: bucket.label,
    frontColor: colors.chartPrimary,
  }));

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Time by tag
        </Text>
        {!hasTagData(summary) ? (
          <Text className="text-center" style={{ color: colors.textMuted }}>
            No data for this period
          </Text>
        ) : (
          <View className="items-center">
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
            />
            <TagLegend items={summary.byTag} />
          </View>
        )}
      </ThemedSurface>

      <ThemedSurface className="mb-8 p-4">
        <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          {summary.buckets.length > 1 ? 'Breakdown' : 'Daily total'}
        </Text>
        {!hasBucketData(summary) ? (
          <Text className="text-center" style={{ color: colors.textMuted }}>
            No breakdown data
          </Text>
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
            {...chartYAxisProps}
            yAxisTextStyle={{ color: colors.chartText, fontSize: 12 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 12 }}
          />
        )}
      </ThemedSurface>
    </>
  );
}

export function BarsView({ summary, period }: ChartViewProps & { period: PeriodType }) {
  const colors = useAppColors();
  const tagBarData = buildTagBarData(summary).map((item) => ({
    value: item.value,
    frontColor: item.frontColor,
    label: '',
    topLabelComponent: () => (
      <Text
        numberOfLines={2}
        style={{
          color: colors.chartText,
          fontSize: 12,
          textAlign: 'center',
          width: 64,
        }}
      >
        {item.label}
      </Text>
    ),
  }));
  const lineData = buildBucketLineData(summary);
  const tagBarMax = Math.max(...tagBarData.map((item) => item.value), 60);

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Time by tag
        </Text>
        {!hasTagData(summary) ? (
          <Text className="text-center" style={{ color: colors.textMuted }}>
            No data for this period
          </Text>
        ) : (
          <View className="items-center">
            <BarChart
              data={tagBarData}
              barWidth={22}
              spacing={18}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              noOfSections={4}
              maxValue={tagBarMax}
              overflowTop={8}
              yAxisExtraHeight={40}
              topLabelContainerStyle={{ width: 64, marginBottom: 6 }}
              {...chartYAxisProps}
              yAxisTextStyle={{ color: colors.chartText, fontSize: 12 }}
              xAxisLabelTextStyle={{ height: 0, opacity: 0 }}
            />
          </View>
        )}
      </ThemedSurface>

      {period !== 'day' ? (
        <ThemedSurface className="mb-8 p-4">
          <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
            Trend
          </Text>
          {!hasBucketData(summary) ? (
            <Text className="text-center" style={{ color: colors.textMuted }}>
              No trend data
            </Text>
          ) : (
            <LineChart
              data={lineData}
              curved
              color={colors.chartPrimary}
              thickness={2}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              noOfSections={4}
              maxValue={Math.max(...lineData.map((item) => item.value), 60)}
              {...chartYAxisProps}
              yAxisTextStyle={{ color: colors.chartText, fontSize: 12 }}
              xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 12 }}
            />
          )}
        </ThemedSurface>
      ) : null}
    </>
  );
}
