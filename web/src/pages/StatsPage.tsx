import { useEffect, useMemo, useState } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { fetchAllEntries, fetchGeofences } from '@/services/data';
import { getStatsSummary } from '@/services/statsService';
import type { Geofence, PeriodType, TimeEntry } from '@/types';
import { formatPeriodLabel, shiftPeriod } from '@/utils/periodBounds';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

export function StatsPage() {
  const colors = useAppColors();
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchAllEntries(user.id), fetchGeofences(user.id)])
      .then(([nextEntries, nextGeofences]) => {
        setEntries(nextEntries);
        setGeofences(nextGeofences);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const summary = useMemo(
    () => getStatsSummary(anchorDate, period, entries, geofences),
    [anchorDate, period, entries, geofences],
  );

  if (loading) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Stats
      </h1>

      <ThemedSurface className="mb-4 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(['day', 'week', 'month'] as PeriodType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className="rounded-lg px-3 py-2 text-sm font-semibold capitalize"
              style={{
                backgroundColor: period === item ? colors.selectedBg : colors.secondaryBg,
                color: period === item ? colors.selectedText : colors.textMuted,
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setAnchorDate(shiftPeriod(anchorDate, period, -1))}>
            ←
          </button>
          <p className="text-sm font-medium" style={{ color: colors.text }}>
            {formatPeriodLabel(anchorDate, period)}
          </p>
          <button type="button" onClick={() => setAnchorDate(shiftPeriod(anchorDate, period, 1))}>
            →
          </button>
        </div>
      </ThemedSurface>

      <ThemedSurface className="mb-4 grid grid-cols-2 gap-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Total time
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>
            {formatDurationLong(summary.totalMs)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Entries
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>
            {summary.entryCount}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Top tag
          </p>
          <p className="text-lg font-semibold" style={{ color: summary.topTag?.color ?? colors.text }}>
            {summary.topTag ? formatTagName(summary.topTag.name) : '—'}
          </p>
        </div>
      </ThemedSurface>

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Time by tag
        </h2>
        {summary.byTag.length === 0 ? (
          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            No data for this period
          </p>
        ) : (
          summary.byTag.map((item) => {
            const share = summary.totalMs > 0 ? item.durationMs / summary.totalMs : 0;
            return (
              <div key={item.tag.id} className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <span style={{ color: colors.textSecondary }}>{formatTagName(item.tag.name)}</span>
                  <span className="font-semibold" style={{ color: colors.text }}>
                    {formatDurationLong(item.durationMs)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.secondaryBg }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(share * 100, 2)}%`, backgroundColor: colors.chartPrimary }}
                  />
                </div>
              </div>
            );
          })
        )}
      </ThemedSurface>

      {summary.byGeofence.length > 0 ? (
        <ThemedSurface className="mb-4 p-4">
          <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
            Time by place
          </h2>
          {summary.byGeofence.map((item) => (
            <div key={item.geofenceId} className="mb-3 flex items-center justify-between">
              <span style={{ color: colors.textSecondary }}>{item.name}</span>
              <span className="font-semibold" style={{ color: colors.text }}>
                {formatDurationLong(item.durationMs)}
              </span>
            </div>
          ))}
        </ThemedSurface>
      ) : null}

      <ThemedSurface className="p-4">
        <h2 className="mb-4 text-base font-semibold" style={{ color: colors.text }}>
          Breakdown
        </h2>
        <div className="space-y-3">
          {summary.buckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span style={{ color: colors.textSecondary }}>{bucket.label}</span>
                <span style={{ color: colors.text }}>{formatDurationLong(bucket.durationMs)}</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: colors.secondaryBg }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${summary.totalMs > 0 ? Math.max((bucket.durationMs / summary.totalMs) * 100, 2) : 0}%`,
                    backgroundColor: colors.chartPrimary,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ThemedSurface>
    </div>
  );
}
