import { Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { buildStackData, hasBucketData } from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { StatsSummary } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';

interface StackedViewProps {
  summary: StatsSummary;
}

export function StackedView({ summary }: StackedViewProps) {
  const colors = useAppColors();
  const stackData = buildStackData(summary)
    .filter((item) => item.stacks.length > 0)
    .map((item) => {
      const bucket = summary.bucketTagBreakdown.find((entry) => entry.label === item.label);
      const totalMs = bucket?.totalMs ?? 0;

      return {
        ...item,
        topLabelComponent: () => (
          <Text style={{ color: colors.chartText, fontSize: 10, textAlign: 'center' }}>
            {formatDurationLong(totalMs)}
          </Text>
        ),
      };
    });
  const maxStackTotal = Math.max(
    ...stackData.map((item) => item.stacks.reduce((sum, stack) => sum + stack.value, 0)),
    60,
  );

  return (
    <ThemedSurface className="mb-8 p-4">
      <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
        Tag mix over time
      </Text>
      {!hasBucketData(summary) || stackData.length === 0 ? (
        <Text className="text-center" style={{ color: colors.textMuted }}>
          No data for this period
        </Text>
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
            overflowTop={24}
            yAxisExtraHeight={24}
            topLabelContainerStyle={{ marginBottom: 4 }}
            yAxisTextStyle={{ color: colors.chartText, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 10 }}
          />
          <TagLegend items={summary.byTag} />
        </>
      )}
    </ThemedSurface>
  );
}
