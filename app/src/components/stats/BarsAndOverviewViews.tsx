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
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { StatsSummary } from '@/types';

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
              showText
              textColor={colors.text}
              textSize={11}
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
            yAxisTextStyle={{ color: colors.chartText, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 10 }}
          />
        )}
      </ThemedSurface>
    </>
  );
}

export function BarsView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const tagBarData = buildTagBarData(summary);
  const lineData = buildBucketLineData(summary);

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
            yAxisTextStyle={{ color: colors.chartText, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 10 }}
          />
        )}
      </ThemedSurface>

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
            yAxisTextStyle={{ color: colors.chartText, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 10 }}
          />
        )}
      </ThemedSurface>
    </>
  );
}
