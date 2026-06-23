import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag } from '@/types';
import {
  defaultManualEntryTimes,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/utils/manualEntryDefaults';

interface AddManualSessionModalProps {
  visible: boolean;
  tags: Tag[];
  onClose: () => void;
  onSave: (tagIds: string[], startedAt: number, endedAt: number) => Promise<void>;
}

export function AddManualSessionModal({
  visible,
  tags,
  onClose,
  onSave,
}: AddManualSessionModalProps) {
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const { startAt, endAt } = defaultManualEntryTimes();
    setStartValue(toDatetimeLocalValue(startAt));
    setEndValue(toDatetimeLocalValue(endAt));
    setError(null);
    setSaving(false);
  }, [visible]);

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
      await onSave([selectedTagId], startedAt.getTime(), endedAt.getTime());
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

  return (
    <BottomSheetModal visible={visible} title="Add past session" onClose={onClose} maxHeightFraction={0.75}>
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

      {error ? (
        <p className="mt-3 text-sm font-medium" style={{ color: colors.destructive }}>
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <ActionButton
          label={saving ? 'Saving…' : 'Add session'}
          onClick={() => {
            handleSave().catch(console.error);
          }}
          className="w-full"
          disabled={saving}
        />
      </div>
    </BottomSheetModal>
  );
}
