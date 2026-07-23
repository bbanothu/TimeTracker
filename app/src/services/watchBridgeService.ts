import * as FileSystem from 'expo-file-system/legacy';

import { filterDisplayTags } from '@/constants/defaultPlace';
import { getAllTags, getTodayEntries } from '@/db/client';
import { isDatabaseReady } from '@/services/appInitService';
import { getAutoTrackingState } from '@/services/geofenceStatus';
import { getGoogleCalendarStatus } from '@/services/googleCalendarService';
import { getProfilePhotoUri } from '@/services/profilePhotoService';
import { buildProfileDisplayName, fetchMyProfile } from '@/services/profileService';
import { isWatchBridgeSupported, setWatchState } from '../../modules/watch-bridge';
import { supabase } from '@/lib/supabase';
import type { ActiveSession, Tag, TimeEntry } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import { clipDurationMs, getPeriodBounds } from '@/utils/periodBounds';
import { analyticsVisibleDurationMs } from '@/utils/tagAnalytics';
import { flattenTags } from '@/utils/tagTree';

type WatchSessionPayload = {
  id: string;
  label: string;
  color: string;
  startedAt: number;
  alarmAt?: number;
};

type WatchHistoryPayload = {
  id: string;
  label: string;
  color: string;
  durationMs: number;
};

type WatchUserPayload = {
  name: string;
  initial: string;
  email: string;
  memberSince?: string;
  photoBase64?: string;
};

type WatchAccountPayload = {
  calendarConnected: boolean;
  calendarSubtitle: string;
  autoTrackingOn: boolean;
  autoTrackingEnabled: boolean;
  autoTrackingSubtitle: string;
};

let cachedUser: WatchUserPayload = { name: 'You', initial: '?', email: '' };
let cachedAccount: WatchAccountPayload = {
  calendarConnected: false,
  calendarSubtitle: '',
  autoTrackingOn: false,
  autoTrackingEnabled: false,
  autoTrackingSubtitle: 'Only tracks while the app is open',
};

function sessionPayload(session: ActiveSession): WatchSessionPayload {
  const payload: WatchSessionPayload = {
    id: session.id,
    label: session.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session',
    color: session.tags[0]?.color ?? '#FF9F0A',
    startedAt: session.startedAt,
  };
  if (session.alarmAt != null) {
    payload.alarmAt = session.alarmAt;
  }
  return payload;
}

function historyPayload(entry: TimeEntry): WatchHistoryPayload | null {
  if (entry.endedAt == null) return null;
  return {
    id: entry.id,
    label: entry.tags.map((tag) => formatTagName(tag.name)).join(', ') || 'Session',
    color: entry.tags[0]?.color ?? '#FF9F0A',
    durationMs: Math.max(0, entry.endedAt - entry.startedAt),
  };
}

/** All user-facing tags (unknown filtered), flattened for the Watch picker. */
function tagsForWatch(tags: Tag[]): Array<{ id: string; name: string; color: string }> {
  const display = filterDisplayTags(tags);
  if (display.length === 0) return [];

  return flattenTags(display).map((item) => ({
    id: item.tag.id,
    name: formatTagName(item.tag.name),
    color: item.tag.color,
  }));
}

function initialFrom(name: string, email: string): string {
  const fromName = name.trim().charAt(0);
  if (fromName) return fromName.toUpperCase();
  const fromEmail = email.trim().charAt(0);
  return fromEmail ? fromEmail.toUpperCase() : '?';
}

function formatMemberSince(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Same hero total as the phone Track screen. */
function computeHeroElapsedMs(sessions: ActiveSession[], todayEntries: TimeEntry[]): number {
  const now = Date.now();
  const { start, end } = getPeriodBounds(new Date(), 'day');
  const rangeStart = start.getTime();
  const rangeEnd = end.getTime();

  const todayCompletedMs = todayEntries.reduce((sum, entry) => {
    if (entry.endedAt == null) return sum;
    return (
      sum +
      analyticsVisibleDurationMs(
        clipDurationMs(entry.startedAt, entry.endedAt, rangeStart, rangeEnd),
        entry.tags,
      )
    );
  }, 0);

  const activeVisibleMs = sessions.map((session) =>
    analyticsVisibleDurationMs(
      clipDurationMs(session.startedAt, now, rangeStart, rangeEnd),
      session.tags,
    ),
  );
  const activeMs = activeVisibleMs.length === 0 ? 0 : Math.max(...activeVisibleMs);
  return todayCompletedMs + activeMs;
}

async function refreshAccountExtras(): Promise<void> {
  try {
    const [auto, calendar] = await Promise.all([
      getAutoTrackingState(),
      getGoogleCalendarStatus().catch(() => null),
    ]);

    const autoTrackingOn = auto.status === 'background_active';
    const autoTrackingEnabled = auto.enabledCount > 0;
    const autoTrackingSubtitle =
      auto.enabledCount === 0
        ? 'Save a place on the Map tab first'
        : autoTrackingOn
          ? 'Tracks arrivals when the app is closed'
          : 'Only tracks while the app is open';

    const calendarConnected = calendar?.connected === true;
    const calendarSubtitle = calendarConnected
      ? [
          calendar?.googleEmail,
          (calendar?.pendingCount ?? 0) > 0 ? `${calendar?.pendingCount} pending` : 'Up to date',
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

    cachedAccount = {
      calendarConnected,
      calendarSubtitle,
      autoTrackingOn,
      autoTrackingEnabled,
      autoTrackingSubtitle,
    };
  } catch (error) {
    console.warn('[WatchBridge] account extras refresh failed', error);
  }
}

/** Load name + avatar + account extras for the Watch. */
export async function refreshWatchUserProfile(userId: string): Promise<void> {
  try {
    const [profile, auth] = await Promise.all([fetchMyProfile(), supabase.auth.getUser()]);
    const name =
      buildProfileDisplayName({
        firstName: profile.firstName,
        lastName: profile.lastName,
      }) ??
      profile.email.split('@')[0] ??
      'You';

    let photoBase64: string | undefined;
    const uri = await getProfilePhotoUri(userId);
    if (uri) {
      const raw = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (raw.length > 0) {
        photoBase64 = raw;
      }
    }

    cachedUser = {
      name,
      initial: initialFrom(name, profile.email),
      email: profile.email,
      memberSince: formatMemberSince(auth.data.user?.created_at),
      ...(photoBase64 ? { photoBase64 } : {}),
    };

    await refreshAccountExtras();
  } catch (error) {
    console.warn('[WatchBridge] profile refresh failed', error);
  }
}

export function clearWatchUserProfile(): void {
  cachedUser = { name: 'You', initial: '?', email: '' };
  cachedAccount = {
    calendarConnected: false,
    calendarSubtitle: '',
    autoTrackingOn: false,
    autoTrackingEnabled: false,
    autoTrackingSubtitle: 'Only tracks while the app is open',
  };
}

/** Snapshot phone timer state for the Watch companion. */
export function pushWatchState(ready: boolean, sessions: ActiveSession[]): void {
  if (!isWatchBridgeSupported()) {
    console.warn('[WatchBridge] skip push — native module unavailable');
    return;
  }

  const tags = ready && isDatabaseReady() ? getAllTags() : [];
  const todayEntries = ready && isDatabaseReady() ? getTodayEntries() : [];
  const sessionList = sessions.map(sessionPayload);
  const history = todayEntries
    .map(historyPayload)
    .filter((item): item is WatchHistoryPayload => item != null)
    .slice(0, 30);
  const trackedAt = Date.now();
  const totalTrackingMs =
    ready && isDatabaseReady() ? computeHeroElapsedMs(sessions, todayEntries) : 0;

  const user: WatchUserPayload = {
    name: cachedUser.name,
    initial: cachedUser.initial,
    email: cachedUser.email,
  };
  if (cachedUser.memberSince) {
    user.memberSince = cachedUser.memberSince;
  }
  if (cachedUser.photoBase64) {
    user.photoBase64 = cachedUser.photoBase64;
  }

  const state: Record<string, unknown> = {
    ready,
    sessions: sessionList,
    tags: tagsForWatch(tags),
    history,
    user,
    account: cachedAccount,
    totalTrackingMs,
    trackedAt,
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
    'photo=',
    Boolean(user.photoBase64),
    'calendar=',
    cachedAccount.calendarConnected,
    'totalMs=',
    totalTrackingMs,
  );
  setWatchState(state);
}

/** Refresh calendar/auto-tracking extras then push current sessions. */
export async function refreshWatchAccountAndPush(sessions: ActiveSession[]): Promise<void> {
  await refreshAccountExtras();
  pushWatchState(true, sessions);
}
