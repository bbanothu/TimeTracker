import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { ActiveSessionsList } from '@/components/ui/ActiveSessionsList';
import { ActionButton } from '@/components/ui/ActionButton';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { EntryList } from '@/components/ui/EntryList';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useTimer } from '@/contexts/TimerContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';

export function TrackPage() {
  const colors = useAppColors();
  const { ready, sessions, todayEntries, tick, startManual, stop } = useTimer();
  const { tags } = useTags();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  void tick;

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  if (!ready) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  const handleStart = () => {
    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose a tag before starting.');
        return;
      }
      startManual([selectedTagId]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: colors.headerText }}>
          Track
        </h1>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link
            to="/profile"
            className="rounded-full border px-3 py-1.5 text-sm font-semibold"
            style={{ borderColor: colors.surfaceBorder, color: colors.text }}
          >
            Account
          </Link>
        </div>
      </div>

      <ThemedSurface className="mb-6 p-4">
        <p className="mb-3 text-sm font-medium" style={{ color: colors.textMuted }}>
          Start new session
        </p>
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
        <div className="mt-4">
          <ActionButton label="Start" onClick={handleStart} className="w-full" />
        </div>
      </ThemedSurface>

      {sessions.length > 0 ? (
        <section className="mb-4">
          <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
            Active ({sessions.length})
          </p>
          <ActiveSessionsList
            sessions={sessions}
            tags={tags}
            onStop={(sessionId) => {
              stop(sessionId).catch(console.error);
            }}
          />
        </section>
      ) : (
        <p className="mb-4 text-center text-sm" style={{ color: colors.textMuted }}>
          No active sessions yet.
        </p>
      )}

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Today ({todayEntries.length})
      </p>
      <EntryList entries={todayEntries} emptyMessage="No tracked time yet today." />
    </div>
  );
}
