import { format } from 'date-fns';
import { alarmOutline } from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { StopSessionButton } from '@/components/ui/SessionControlButtons';
import { useAppColors } from '@/contexts/ThemeContext';
import type { ActiveSession, Tag } from '@/types';
import { formatDuration, formatTagName } from '@/utils/formatDuration';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  tags: Tag[];
  geofenceNames?: Map<string, string>;
  tick?: number;
  onStop: (sessionId: string) => void;
  onExtendAlarm?: (sessionId: string, extraMs: number) => void;
}

function formatAlarmSubtitle(alarmAt: number, now: number): string {
  if (alarmAt <= now) {
    return `Alarm overdue · since ${format(alarmAt, 'h:mm a')}`;
  }
  return `Alarm in ${formatDuration(alarmAt - now)} · ${format(alarmAt, 'h:mm a')}`;
}

export function ActiveSessionsList({
  sessions,
  tags,
  geofenceNames,
  tick = 0,
  onStop,
  onExtendAlarm,
}: ActiveSessionsListProps) {
  const colors = useAppColors();
  void tick;
  const now = Date.now();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {sessions.map((session, index) => {
        const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
        const elapsed = now - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames?.get(session.geofenceId) : null;
        const tagLabel = sessionTags.map((tag) => formatTagName(tag.name)).join(', ');
        const placeSubtitle =
          session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;
        const alarmSubtitle =
          session.alarmAt != null ? formatAlarmSubtitle(session.alarmAt, now) : null;
        const overdue = session.alarmAt != null && session.alarmAt <= now;

        return (
          <div
            key={session.id}
            style={
              index < sessions.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: sessionTags[0]?.color ?? colors.primary }}
                  />
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: colors.textOnBg }}
                    title={tagLabel}
                  >
                    {tagLabel}
                  </span>
                </div>
                {placeSubtitle ? (
                  <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                    {placeSubtitle}
                  </p>
                ) : null}
                {alarmSubtitle ? (
                  <p
                    className="ml-3.5 text-xs"
                    style={{ color: overdue ? colors.destructive : colors.textMuted }}
                  >
                    {alarmSubtitle}
                  </p>
                ) : null}
              </div>
              <span
                className="shrink-0 font-mono text-sm font-semibold tabular-nums"
                style={{ color: colors.textOnBg }}
              >
                {formatDuration(elapsed)}
              </span>
              <StopSessionButton onClick={() => onStop(session.id)} />
            </div>

            {session.alarmAt != null && onExtendAlarm ? (
              <div className="flex gap-2 px-3 pb-3 pl-8">
                <button
                  type="button"
                  onClick={() => onExtendAlarm(session.id, 15 * 60_000)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: colors.glassBorder, backgroundColor: colors.glass, color: colors.text }}
                >
                  <AppIcon icon={alarmOutline} size={14} color={colors.text} />
                  +15 min
                </button>
                <button
                  type="button"
                  onClick={() => onExtendAlarm(session.id, 30 * 60_000)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ borderColor: colors.glassBorder, backgroundColor: colors.glass, color: colors.text }}
                >
                  <AppIcon icon={alarmOutline} size={14} color={colors.text} />
                  +30 min
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </ThemedSurface>
  );
}
