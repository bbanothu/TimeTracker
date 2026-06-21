import { BucketBarChart } from '@/components/ui/stats/BucketBarChart';
import { DonutChart } from '@/components/ui/stats/DonutChart';
import { StackedBarChart } from '@/components/ui/stats/StackedBarChart';
import { TagLegend } from '@/components/ui/stats/TagLegend';
import { TrendChart } from '@/components/ui/stats/TrendChart';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import {
  buildPieData,
  buildStackData,
  hasBucketData,
  hasTagData,
} from '@/utils/chartUtils';
import type { GeofenceDuration, StatsSummary, TagDuration } from '@/types';
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
            <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.secondaryBg }}>
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
            <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.secondaryBg }}>
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
  const pieData = buildPieData(summary);

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Time by tag
        </h2>
        {!hasTagData(summary) ? (
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            No data for this period
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <DonutChart slices={pieData} />
            <TagLegend items={summary.byTag} />
          </div>
        )}
      </ThemedSurface>

      <ThemedSurface className="mb-8 p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          {summary.buckets.length > 1 ? 'Breakdown' : 'Daily total'}
        </h2>
        {!hasBucketData(summary) ? (
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            No breakdown data
          </p>
        ) : (
          <BucketBarChart buckets={summary.buckets} />
        )}
      </ThemedSurface>
    </>
  );
}

export function ListView({ summary }: ChartViewProps) {
  const colors = useAppColors();

  return (
    <>
      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
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
        <ThemedSurface className="mb-4 p-4">
          <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
            Time by place
          </h2>
          <PlaceProgressList items={summary.byGeofence} totalMs={summary.totalMs} />
        </ThemedSurface>
      ) : null}

      <ThemedSurface className="mb-8 p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Trend
        </h2>
        {!hasBucketData(summary) ? (
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            No trend data
          </p>
        ) : (
          <TrendChart buckets={summary.buckets} />
        )}
      </ThemedSurface>
    </>
  );
}

export function StackedView({ summary }: ChartViewProps) {
  const colors = useAppColors();
  const stackData = buildStackData(summary).filter((item) => item.stacks.length > 0);

  return (
    <ThemedSurface className="mb-8 p-4">
      <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
        Tag mix over time
      </h2>
      {!hasBucketData(summary) || stackData.length === 0 ? (
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          No data for this period
        </p>
      ) : (
        <>
          <StackedBarChart bars={stackData} />
          <TagLegend items={summary.byTag} className="mt-3 w-full" />
        </>
      )}
    </ThemedSurface>
  );
}

export function TrendView({ summary }: ChartViewProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-8 p-4">
      <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
        Tracked over time
      </h2>
      {!hasBucketData(summary) ? (
        <p className="text-center text-sm" style={{ color: colors.textMuted }}>
          No data for this period
        </p>
      ) : (
        <>
          <TrendChart buckets={summary.buckets} height={220} />
          <TagLegend items={summary.byTag} className="mt-3 w-full" />
        </>
      )}
    </ThemedSurface>
  );
}
