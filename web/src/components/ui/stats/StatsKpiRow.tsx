import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { StatsSummary } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

function KpiTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="p-4 lg:p-5">
      <p
        className="mb-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums lg:text-3xl" style={{ color: colors.text }}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1.5 truncate text-sm" style={{ color: colors.textMuted }}>
          {detail}
        </p>
      ) : null}
    </ThemedSurface>
  );
}

export function StatsKpiRow({ summary }: { summary: StatsSummary }) {
  const topTag = summary.topTag;
  const topTagDuration = topTag
    ? summary.byTag.find((item) => item.tag.id === topTag.id)?.durationMs
    : undefined;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:mb-5">
      <KpiTile label="Total tracked" value={formatDurationLong(summary.totalMs)} />
      <KpiTile
        label="Entries"
        value={String(summary.entryCount)}
        detail={summary.entryCount === 1 ? 'session logged' : 'sessions logged'}
      />
      <KpiTile
        label="Top tag"
        value={topTag ? formatTagName(topTag.name) : '—'}
        detail={topTagDuration !== undefined ? formatDurationLong(topTagDuration) : 'No tagged time'}
      />
    </div>
  );
}
