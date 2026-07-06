export interface GoogleCalendarStatus {
  connected: boolean;
  googleEmail: string | null;
  pendingCount: number;
  lastSyncedAt: string | null;
}

export interface GoogleCalendarSyncResult {
  created: number;
  skipped: number;
  failed: number;
}
