import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { EntryList } from '@/components/ui/EntryList';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { TimerDisplay } from '@/components/ui/TimerDisplay';
import { useSessionTags, useTimer } from '@/contexts/TimerContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { formatTagName } from '@/utils/formatDuration';

export function TrackPage() {
  const colors = useAppColors();
  const { ready, session, todayEntries, tick, startManual, stop } = useTimer();
  const { tags } = useTags();
  const sessionTags = useSessionTags(session, tags);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  void tick;

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
          <Link to="/profile" className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: colors.surfaceBorder, color: colors.text }}>
            Account
          </Link>
        </div>
      </div>

      <TimerDisplay startedAt={session?.startedAt ?? null} isRunning={!!session} />

      {session ? (
        <ThemedSurface className="mb-4 p-4">
          <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
            Active session
          </p>
          <div className="flex flex-wrap gap-2">
            {sessionTags.map((tag) => (
              <span key={tag.id} className="font-semibold" style={{ color: tag.color }}>
                {formatTagName(tag.name)}
              </span>
            ))}
          </div>
        </ThemedSurface>
      ) : (
        <ThemedSurface className="mb-4 p-4">
          <p className="mb-3 text-sm font-medium" style={{ color: colors.textMuted }}>
            Activity
          </p>
          <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />
        </ThemedSurface>
      )}

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-6">
        {!session ? (
          <ActionButton label="Start" onClick={handleStart} className="w-full" />
        ) : (
          <ActionButton label="Stop" onClick={() => stop()} variant="destructive" className="w-full" />
        )}
      </div>

      <h2 className="mb-3 text-lg font-semibold" style={{ color: colors.textOnBg }}>
        Today
      </h2>
      <EntryList entries={todayEntries} emptyMessage="No tracked time yet today." />
    </div>
  );
}
