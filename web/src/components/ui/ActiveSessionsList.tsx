import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStop = (sessionId: string) => {
    onStop(sessionId);
    setExpandedId((current) => (current === sessionId ? null : current));
  };

  const toggleExpanded = (sessionId: string) => {
    setExpandedId((current) => (current === sessionId ? null : sessionId));
  };

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {sessions.map((session, index) => {
        const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
        const elapsed = Date.now() - session.startedAt;
        const geofenceName = session.geofenceId ? geofenceNames?.get(session.geofenceId) : null;
        const tagLabel = sessionTags.map((tag) => formatTagName(tag.name)).join(', ');
        const subtitle =
          session.source === 'geofence' && geofenceName ? `@ ${geofenceName}` : null;
        const expanded = expandedId === session.id;

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
              <button
                type="button"
                onClick={() => toggleExpanded(session.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-90"
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
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {expanded ? '▴' : '▾'}
                    </span>
                  </div>
                  {!expanded && subtitle ? (
                    <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                {!expanded ? (
                  <span
                    className="shrink-0 font-mono text-sm font-semibold tabular-nums"
                    style={{ color: colors.textOnBg }}
                  >
                    {formatDuration(elapsed)}
                  </span>
                ) : null}
              </button>

              {!expanded ? (
                <button
                  type="button"
                  onClick={() => handleStop(session.id)}
                  className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor: colors.destructiveBg,
                    borderColor: colors.destructiveBorder,
                    color: colors.destructiveText,
                  }}
                >
                  Stop
                </button>
              ) : null}
            </div>

            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out"
              style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {sessionTags.map((tag) => (
                          <span key={tag.id} className="font-semibold" style={{ color: tag.color }}>
                            {formatTagName(tag.name)}
                          </span>
                        ))}
                      </div>
                      {session.source === 'geofence' && geofenceName ? (
                        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                          at {geofenceName}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
                        {session.source === 'geofence' ? 'Location tracking' : session.source}
                      </p>
                    </div>
                    <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: colors.textOnBg }}>
                      {formatDuration(elapsed)}
                    </span>
                  </div>
                  <ActionButton
                    label="Stop"
                    onClick={() => handleStop(session.id)}
                    variant="destructiveOutline"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
