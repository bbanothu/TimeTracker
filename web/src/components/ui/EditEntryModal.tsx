import { useEffect, useState } from 'react';

import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag, TimeEntry } from '@/types';
import { parseDatetimeLocalValue, toDatetimeLocalValue } from '@/utils/manualEntryDefaults';

function SaveIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface EditEntryModalProps {
  visible: boolean;
  entry: TimeEntry | null;
  tags: Tag[];
  onClose: () => void;
  onSave: (
    entryId: string,
    tagIds: string[],
    startedAt: number,
    endedAt: number,
    details: string | null,
  ) => Promise<void>;
}

export function EditEntryModal({ visible, entry, tags, onClose, onSave }: EditEntryModalProps) {
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !entry || entry.endedAt == null) return;
    setStartValue(toDatetimeLocalValue(new Date(entry.startedAt)));
    setEndValue(toDatetimeLocalValue(new Date(entry.endedAt)));
    setSelectedTagId(entry.tags[0]?.id ?? null);
    setDetails(entry.details ?? '');
    setError(null);
    setSaving(false);
  }, [visible, entry]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId]);

  const handleSave = async () => {
    if (!entry) return;

    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose an activity.');
        return;
      }
      const startedAt = parseDatetimeLocalValue(startValue);
      const endedAt = parseDatetimeLocalValue(endValue);
      if (!startedAt || !endedAt) {
        setError('Enter valid start and end times.');
        return;
      }
      if (endedAt.getTime() <= startedAt.getTime()) {
        setError('End must be after start.');
        return;
      }
      if (endedAt.getTime() > Date.now()) {
        setError('End cannot be in the future.');
        return;
      }

      setSaving(true);
      await onSave(
        entry.id,
        [selectedTagId],
        startedAt.getTime(),
        endedAt.getTime(),
        details.trim() || null,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save session');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const saveButton = (
    <button
      type="button"
      onClick={() => {
        handleSave().catch(console.error);
      }}
      disabled={saving}
      aria-label="Save changes"
      title="Save"
      className="rounded-full p-1 transition hover:opacity-80 disabled:opacity-50"
    >
      {saving ? <LoadingIndicator size={22} /> : <SaveIcon color={colors.primary} />}
    </button>
  );

  return (
    <BottomSheetModal
      visible={visible}
      title="Edit session"
      onClose={onClose}
      headerActions={saveButton}
      maxHeightFraction={0.85}
    >
      <BottomSheetScroll maxHeightFraction={0.7}>
        <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          Activity
        </p>
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

        <p className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          Start
        </p>
        <input
          type="datetime-local"
          value={startValue}
          onChange={(event) => setStartValue(event.target.value)}
          disabled={saving}
          className="w-full rounded-xl border px-4 py-3 text-base"
          style={inputStyle}
        />

        <p className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          End
        </p>
        <input
          type="datetime-local"
          value={endValue}
          onChange={(event) => setEndValue(event.target.value)}
          disabled={saving}
          className="w-full rounded-xl border px-4 py-3 text-base"
          style={inputStyle}
        />

        <p className="mb-2 mt-4 text-sm font-medium" style={{ color: colors.textMuted }}>
          Details
        </p>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Notes about this session"
          rows={3}
          disabled={saving}
          className="w-full resize-none rounded-xl border px-4 py-3 text-base"
          style={inputStyle}
        />

        {error ? (
          <p className="mt-3 text-sm font-medium" style={{ color: colors.destructive }}>
            {error}
          </p>
        ) : null}
      </BottomSheetScroll>
    </BottomSheetModal>
  );
}
