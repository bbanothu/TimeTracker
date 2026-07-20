import { BucketBarChart } from '@/components/ui/stats/BucketBarChart';
import { DonutChart } from '@/components/ui/stats/DonutChart';
import { StackedBarChart } from '@/components/ui/stats/StackedBarChart';
import { TagLegend } from '@/components/ui/stats/TagLegend';
import { TrendChart } from '@/components/ui/stats/TrendChart';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { buildPieData, buildStackData, hasBucketData, hasTagData } from '@/utils/chartUtils';
import type { GeofenceDuration, PeriodType, StatsSummary, TagDuration } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface ChartViewProps {
  summary: StatsSummary;
}

function TagProgressList({
  items,
  totalMs,
  getColor,
}: {
  items: TagDuration[];
  totalMs: number;
  getColor: (item: TagDuration) => string;
}) {
  const colors = useAppColors();

  return (
    <>
      {items.map((item) => {
        const share = totalMs > 0 ? item.durationMs / totalMs : 0;

        return (
          <div key={item.tag.id} className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                {formatTagName(item.tag.name)}
              </span>
              <span className="text-sm font-semibold" style={{ color: colors.text }}>
                {formatDurationLong(item.durationMs)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: colors.secondaryBg }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(share * 100, 2)}%`,
                  backgroundColor: getColor(item),
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function PlaceProgressList({ items, totalMs }: { items: GeofenceDuration[]; totalMs: number }) {
  const colors = useAppColors();

  return (
    <>
      {items.map((item) => {
        const share = totalMs > 0 ? item.durationMs / totalMs : 0;

        return (
          <div key={item.geofenceId} className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                {item.name}
              </span>
              <span className="text-sm font-semibold" style={{ color: colors.text }}>
                {formatDurationLong(item.durationMs)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: colors.secondaryBg }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(share * 100, 2)}%`,
                  backgroundColor: colors.chartPrimary,
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function OverviewView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const pieData = buildPieData(summary);
  const barHeight = isDesktop ? 220 : 140;
  const donutSize = isDesktop ? 200 : 180;

  return (
    <div className="space-y-4 lg:space-y-5">
      <ThemedSurface className="p-4 lg:p-6">
        <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
          {summary.buckets.length > 1 ? 'Breakdown' : 'Daily total'}
        </h2>
        {!hasBucketData(summary) ? (
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            No breakdown data
          </p>
        ) : (
          <BucketBarChart buckets={summary.buckets} chartHeight={barHeight} />
        )}
      </ThemedSurface>

      <div className="lg:grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-5">
        <ThemedSurface className="p-4 lg:p-6">
          <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
            Time by tag
          </h2>
          {!hasTagData(summary) ? (
            <p className="text-center text-sm" style={{ color: colors.textMuted }}>
              No data for this period
            </p>
          ) : (
            <div className="flex flex-col items-center lg:items-start">
              <DonutChart slices={pieData} size={donutSize} />
              <TagLegend items={summary.byTag} className="mt-4 w-full lg:hidden" />
            </div>
          )}
        </ThemedSurface>

        <ThemedSurface className="mb-8 p-4 lg:mb-0 lg:p-6">
          <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
            Tag breakdown
          </h2>
          {!hasTagData(summary) ? (
            <p className="text-center text-sm" style={{ color: colors.textMuted }}>
              No data for this period
            </p>
          ) : (
            <TagProgressList
              items={summary.byTag}
              totalMs={summary.totalMs}
              getColor={(item) => item.tag.color}
            />
          )}
        </ThemedSurface>
      </div>
    </div>
  );
}

export function ListView({ summary, period }: ChartViewProps & { period: PeriodType }) {
  const colors = useAppColors();

  return (
    <div className="space-y-4 lg:space-y-5">
      <div
        className={
          summary.byGeofence.length > 0
            ? 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-5'
            : undefined
        }
      >
        <ThemedSurface className="p-4 lg:p-6">
          <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
            Time by tag
          </h2>
          {!hasTagData(summary) ? (
            <p className="text-center text-sm" style={{ color: colors.textMuted }}>
              No data for this period
            </p>
          ) : (
            <TagProgressList
              items={summary.byTag}
              totalMs={summary.totalMs}
              getColor={(item) => item.tag.color}
            />
          )}
        </ThemedSurface>

        {summary.byGeofence.length > 0 ? (
          <ThemedSurface className="p-4 lg:p-6">
            <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
              Time by place
            </h2>
            <PlaceProgressList items={summary.byGeofence} totalMs={summary.totalMs} />
          </ThemedSurface>
        ) : null}
      </div>

      {period !== 'day' ? (
        <ThemedSurface className="mb-8 p-4 lg:mb-0 lg:p-6">
          <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
            Trend
          </h2>
          {!hasBucketData(summary) ? (
            <p className="text-center text-sm" style={{ color: colors.textMuted }}>
              No trend data
            </p>
          ) : (
            <TrendChart buckets={summary.buckets} className="h-[220px] lg:h-[380px]" />
          )}
        </ThemedSurface>
      ) : null}
    </div>
  );
}

export function StackedView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const stackData = buildStackData(summary).filter((item) => item.stacks.length > 0);
  const barHeight = isDesktop ? 240 : 140;

  return (
    <ThemedSurface className="mb-8 p-4 lg:mb-0 lg:p-6">
      <h2 className="mb-4 text-base font-semibold lg:text-lg" style={{ color: colors.text }}>
        Tag mix over time
      </h2>
      {!hasBucketData(summary) || stackData.length === 0 ? (
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          No data for this period
        </p>
      ) : (
        <>
          <StackedBarChart bars={stackData} chartHeight={barHeight} />
          <TagLegend items={summary.byTag} className="mt-4 w-full lg:mt-6" />
        </>
      )}
    </ThemedSurface>
  );
}

export function TrendView({ summary }: ChartViewProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-8 flex flex-col p-4 lg:mb-0 lg:min-h-[calc(100dvh-16rem)] lg:p-6">
      <h2
        className="mb-4 shrink-0 text-base font-semibold lg:text-lg"
        style={{ color: colors.text }}
      >
        Tracked over time
      </h2>
      {!hasBucketData(summary) ? (
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          No data for this period
        </p>
      ) : (
        <>
          <TrendChart buckets={summary.buckets} className="min-h-[220px] flex-1 lg:min-h-[400px]" />
          <TagLegend items={summary.byTag} className="mt-4 w-full shrink-0 lg:mt-6" />
        </>
      )}
    </ThemedSurface>
  );
}
