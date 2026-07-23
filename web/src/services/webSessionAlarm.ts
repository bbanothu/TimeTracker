const timers = new Map<string, number>();
const notified = new Set<string>();

async function ensurePermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function fireNotification(sessionId: string, tagLabel: string, overdue: boolean): void {
  const key = `${sessionId}:${overdue ? 'overdue' : 'due'}`;
  if (notified.has(key)) return;
  notified.add(key);

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(overdue ? `${tagLabel} alarm overdue` : `${tagLabel} alarm`, {
      body: overdue
        ? 'Session is still running. Finish or extend.'
        : 'Time is up. Finish to log, or extend.',
      tag: `session-alarm-${sessionId}`,
    });
  } catch {
    // Ignore notification failures (e.g. insecure context).
  }
}

export function cancelWebSessionAlarm(sessionId: string): void {
  const handle = timers.get(sessionId);
  if (handle != null) {
    window.clearTimeout(handle);
    timers.delete(sessionId);
  }
  for (const key of [...notified]) {
    if (key.startsWith(`${sessionId}:`)) notified.delete(key);
  }
}

export async function scheduleWebSessionAlarm(
  sessionId: string,
  alarmAt: number,
  tagLabel: string,
): Promise<void> {
  cancelWebSessionAlarm(sessionId);
  await ensurePermission();

  const delay = alarmAt - Date.now();
  if (delay <= 0) {
    fireNotification(sessionId, tagLabel, true);
    return;
  }

  const handle = window.setTimeout(() => {
    timers.delete(sessionId);
    fireNotification(sessionId, tagLabel, false);
  }, delay);
  timers.set(sessionId, handle);
}

export function rescheduleWebSessionAlarms(
  sessions: Array<{ id: string; alarmAt: number | null; tagLabel: string }>,
): void {
  const activeIds = new Set(sessions.map((session) => session.id));
  for (const id of [...timers.keys()]) {
    if (!activeIds.has(id)) cancelWebSessionAlarm(id);
  }

  for (const session of sessions) {
    if (session.alarmAt == null) {
      cancelWebSessionAlarm(session.id);
      continue;
    }
    void scheduleWebSessionAlarm(session.id, session.alarmAt, session.tagLabel);
  }
}
