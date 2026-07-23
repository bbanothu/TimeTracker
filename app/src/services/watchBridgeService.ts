import { filterDisplayTags } from '@/constants/defaultPlace';
import { getAllEntries, getAllTags } from '@/db/client';
import { isDatabaseReady } from '@/services/appInitService';
import { isWatchBridgeSupported, setWatchState } from '../../modules/watch-bridge';
import type { ActiveSession, Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import { flattenTags } from '@/utils/tagTree';
import { buildTagUsageCounts, sortFlatTagsByUsage } from '@/utils/tagUsage';

const MAX_WATCH_TAGS = 5;

type WatchSessionPayload = {
  id: string;
  label: string;
  startedAt: number;
  alarmAt?: number;
};

function sessionPayload(session: ActiveSession): WatchSessionPayload {
  const payload: WatchSessionPayload = {
    id: session.id,
    label: session.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session',
    startedAt: session.startedAt,
  };
  if (session.alarmAt != null) {
    payload.alarmAt = session.alarmAt;
  }
  return payload;
}

function topTagsForWatch(tags: Tag[]): Array<{ id: string; name: string; color: string }> {
  const display = filterDisplayTags(tags);
  if (display.length === 0 || !isDatabaseReady()) {
    return [];
  }

  const flat = flattenTags(display);
  const usage = buildTagUsageCounts(getAllEntries());
  const sorted = sortFlatTagsByUsage(flat, usage).slice(0, MAX_WATCH_TAGS);
  return sorted.map((item) => ({
    id: item.tag.id,
    name: formatTagName(item.tag.name),
    color: item.tag.color,
  }));
}

/** Snapshot phone timer state for the Watch companion. */
export function pushWatchState(ready: boolean, sessions: ActiveSession[]): void {
  if (!isWatchBridgeSupported()) {
    console.warn('[WatchBridge] skip push — native module unavailable');
    return;
  }

  const tags = ready && isDatabaseReady() ? getAllTags() : [];
  const sessionList = sessions.map(sessionPayload);

  // Property-list safe: never send null (breaks WCSession.updateApplicationContext).
  const state: Record<string, unknown> = {
    ready,
    sessions: sessionList,
    tags: topTagsForWatch(tags),
  };
  if (sessionList[0]) {
    state.session = sessionList[0];
  }

  console.log(
    '[WatchBridge] push ready=',
    ready,
    'tags=',
    (state.tags as unknown[]).length,
    'sessions=',
    sessionList.length,
  );
  setWatchState(state);
}
