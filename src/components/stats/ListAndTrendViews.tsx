import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { buildBucketLineData, hasBucketData, hasTagData } from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { useTheme } from '@/hooks/useTheme';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';
import type { StatsSummary } from '@/types';

interface ChartViewProps {
  summary: StatsSummary;
}

export function ListView({ summary }: ChartViewProps) {
  const { isDark } = useTheme();
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
          summary.byTag.map((item) => {
            const share = summary.totalMs > 0 ? item.durationMs / summary.totalMs : 0;

            return (
              <View key={item.tag.id} className="mb-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatTagName(item.tag.name)}
                  </Text>
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatDurationLong(item.durationMs)}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(share * 100, 2)}%`,
                      backgroundColor: item.tag.color,
                    }}
                  />
                </View>
              </View>
            );
          })
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
            areaChart
            curved
            color="#2563EB"
            startFillColor="#3B82F6"
            endFillColor="#EFF6FF"
            startOpacity={0.4}
            endOpacity={0.05}
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

export function TrendView({ summary }: ChartViewProps) {
  const { isDark } = useTheme();
  const lineData = buildBucketLineData(summary);
  const chartTextColor = isDark ? '#CBD5E1' : '#64748B';

  return (
    <View className="mb-8 rounded-2xl bg-white p-4 dark:bg-slate-900">
      <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        Tracked over time
      </Text>
      {!hasBucketData(summary) ? (
        <Text className="text-center text-slate-500 dark:text-slate-400">No data for this period</Text>
      ) : (
        <>
          <LineChart
            data={lineData}
            areaChart
            curved
            height={220}
            color="#2563EB"
            startFillColor="#3B82F6"
            endFillColor={isDark ? '#1E293B' : '#EFF6FF'}
            startOpacity={0.5}
            endOpacity={0.05}
            thickness={3}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(...lineData.map((item) => item.value), 60)}
            yAxisTextStyle={{ color: chartTextColor, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: chartTextColor, fontSize: 10 }}
          />
          <TagLegend items={summary.byTag} compact />
        </>
      )}
    </View>
  );
}
