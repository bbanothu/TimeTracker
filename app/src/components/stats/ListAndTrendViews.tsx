import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { buildBucketLineData, hasBucketData, hasTagData } from '@/components/stats/chartUtils';
import { TagLegend } from '@/components/stats/TagLegend';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import type { StatsSummary } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface ChartViewProps {
  summary: StatsSummary;
}

export function ListView({ summary }: ChartViewProps) {
  const colors = useAppColors();
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
          summary.byTag.map((item) => {
            const share = summary.totalMs > 0 ? item.durationMs / summary.totalMs : 0;

            return (
              <View key={item.tag.id} className="mb-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    {formatTagName(item.tag.name)}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {formatDurationLong(item.durationMs)}
                  </Text>
                </View>
                <View
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.secondaryBg }}
                >
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
      </ThemedSurface>

      {summary.byGeofence.length > 0 ? (
        <ThemedSurface className="mb-8 p-4">
          <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
            Time by place
          </Text>
          {summary.byGeofence.map((item) => {
            const share = summary.totalMs > 0 ? item.durationMs / summary.totalMs : 0;

            return (
              <View key={item.geofenceId} className="mb-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    {item.name}
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {formatDurationLong(item.durationMs)}
                  </Text>
                </View>
                <View
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.secondaryBg }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(share * 100, 2)}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </ThemedSurface>
      ) : null}

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
            areaChart
            curved
            color={colors.chartPrimary}
            startFillColor={colors.chartSecondary}
            endFillColor={colors.surface}
            startOpacity={0.4}
            endOpacity={0.05}
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

export function TrendView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const lineData = buildBucketLineData(summary);

  return (
    <ThemedSurface className="mb-8 p-4">
      <Text className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
        Tracked over time
      </Text>
      {!hasBucketData(summary) ? (
        <Text className="text-center" style={{ color: colors.textMuted }}>
          No data for this period
        </Text>
      ) : (
        <>
          <LineChart
            data={lineData}
            areaChart
            curved
            height={220}
            color={colors.chartPrimary}
            startFillColor={colors.chartSecondary}
            endFillColor={colors.surface}
            startOpacity={0.5}
            endOpacity={0.05}
            thickness={3}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(...lineData.map((item) => item.value), 60)}
            overflowTop={28}
            textColor={colors.chartText}
            textFontSize={10}
            textShiftY={-8}
            yAxisTextStyle={{ color: colors.chartText, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.chartText, fontSize: 10 }}
          />
          <TagLegend items={summary.byTag} />
        </>
      )}
    </ThemedSurface>
  );
}
