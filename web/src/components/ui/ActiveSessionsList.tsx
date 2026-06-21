import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { ActiveSession, Tag } from '@/types';
import { formatDuration, formatTagName } from '@/utils/formatDuration';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
  tags: Tag[];
  geofenceNames?: Map<string, string>;
  onStop: (sessionId: string) => void;
}

export function ActiveSessionsList({ sessions, tags, geofenceNames, onStop }: ActiveSessionsListProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {sessions.map((session, index) => {
        const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
        const elapsed = Date.now() - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames?.get(session.geofenceId) : null;
        const tagLabel = sessionTags.map((tag) => formatTagName(tag.name)).join(', ');
        const subtitle =
          session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;

        return (
          <div
            key={session.id}
            className="flex items-center gap-2 px-3 py-2.5"
            style={
              index < sessions.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
          >
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
              {subtitle ? (
                <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            <span
              className="shrink-0 font-mono text-sm font-semibold tabular-nums"
              style={{ color: colors.textOnBg }}
            >
              {formatDuration(elapsed)}
            </span>
            <button
              type="button"
              onClick={() => onStop(session.id)}
              className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: colors.destructiveBg,
                borderColor: colors.destructiveBorder,
                color: colors.destructiveText,
              }}
            >
              Stop
            </button>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
