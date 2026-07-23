const STORAGE_KEY = 'timetracker-session-alarms';

function readMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        next[id] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Sets this session's alarm and clears any other session alarms (one at a time). */
export function setSessionAlarmAt(sessionId: string, alarmAt: number): void {
  writeMap({ [sessionId]: alarmAt });
}

export function clearSessionAlarmAt(sessionId: string): void {
  const map = readMap();
  if (!(sessionId in map)) return;
  delete map[sessionId];
  writeMap(map);
}

export function pruneSessionAlarms(activeSessionIds: string[]): void {
  const active = new Set(activeSessionIds);
  const map = readMap();
  let changed = false;
  for (const id of Object.keys(map)) {
    if (!active.has(id)) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) writeMap(map);
}

export function attachAlarmsToSessions<T extends { id: string }>(
  sessions: T[],
): Array<T & { alarmAt: number | null }> {
  const map = readMap();
  return sessions.map((session) => ({
    ...session,
    alarmAt: map[session.id] ?? null,
  }));
}
