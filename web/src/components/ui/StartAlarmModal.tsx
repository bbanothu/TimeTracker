import { addMinutes, format } from 'date-fns';
import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { TagDropdown } from '@/components/ui/TagDropdown';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag } from '@/types';

const DURATION_CHIPS_MINUTES = [15, 25, 45, 60] as const;

interface StartAlarmModalProps {
  visible: boolean;
  tags: Tag[];
  initialTagId?: string | null;
  onClose: () => void;
  onStart: (tagIds: string[], alarmAt: number) => void | Promise<void>;
}

type Mode = 'duration' | 'until';

function toTimeInputValue(date: Date): string {
  return format(date, 'HH:mm');
}

export function StartAlarmModal({
  visible,
  tags,
  initialTagId = null,
  onClose,
  onStart,
}: StartAlarmModalProps) {
  const colors = useAppColors();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('duration');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [untilValue, setUntilValue] = useState(() => toTimeInputValue(addMinutes(new Date(), 30)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode('duration');
    setDurationMinutes(25);
    setCustomMinutes('');
    setUntilValue(toTimeInputValue(addMinutes(new Date(), 30)));
    setError(null);
    setSaving(false);
  }, [visible]);

  useEffect(() => {
    if (tags.length === 0) {
      setSelectedTagId(null);
      return;
    }
    if (initialTagId && tags.some((tag) => tag.id === initialTagId)) {
      setSelectedTagId(initialTagId);
      return;
    }
    if (!selectedTagId || !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(tags[0].id);
    }
  }, [tags, selectedTagId, initialTagId, visible]);

  const resolveAlarmAt = (): number | null => {
    if (mode === 'duration') {
      const custom = Number.parseInt(customMinutes.trim(), 10);
      const minutes =
        customMinutes.trim().length > 0 && Number.isFinite(custom) && custom > 0
          ? custom
          : durationMinutes;
      if (!Number.isFinite(minutes) || minutes <= 0) return null;
      return Date.now() + minutes * 60_000;
    }

    const [hoursRaw, minutesRaw] = untilValue.split(':');
    const hours = Number.parseInt(hoursRaw ?? '', 10);
    const minutes = Number.parseInt(minutesRaw ?? '', 10);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next.getTime() <= Date.now() + 5_000) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  };

  const handleStart = async () => {
    try {
      setError(null);
      if (!selectedTagId) {
        setError('Choose an activity.');
        return;
      }
      const alarmAt = resolveAlarmAt();
      if (alarmAt == null || alarmAt <= Date.now() + 5_000) {
        setError('Pick an end time at least a few seconds from now.');
        return;
      }
      setSaving(true);
      await onStart([selectedTagId], alarmAt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start alarm');
    } finally {
      setSaving(false);
    }
  };

  const chipClass = (selected: boolean) =>
    `rounded-full border px-3 py-2 text-sm font-semibold transition ${
      selected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
    }`;

  return (
    <BottomSheetModal visible={visible} title="Start alarm" onClose={onClose}>
      <BottomSheetScroll>
        <p className="mb-2 text-xs font-medium" style={{ color: colors.textMuted }}>
          Activity
        </p>
        <TagDropdown tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

        <div className="mt-4 mb-2 grid grid-cols-2 gap-2">
          {(['duration', 'until'] as const).map((value) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className="rounded-xl border px-3 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: selected ? colors.selectedBg : colors.inputBg,
                  borderColor: selected ? colors.primary : colors.inputBorder,
                  color: selected ? colors.primary : colors.text,
                }}
              >
                {value === 'duration' ? 'Duration' : 'Until time'}
              </button>
            );
          })}
        </div>

        {mode === 'duration' ? (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {DURATION_CHIPS_MINUTES.map((minutes) => {
                const selected = customMinutes.trim().length === 0 && durationMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      setCustomMinutes('');
                      setDurationMinutes(minutes);
                    }}
                    className={chipClass(selected)}
                    style={{
                      backgroundColor: selected ? colors.selectedBg : colors.inputBg,
                      borderColor: selected ? colors.primary : colors.inputBorder,
                      color: selected ? colors.primary : colors.text,
                    }}
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: colors.textMuted }}>
              Custom minutes
            </label>
            <input
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              inputMode="numeric"
              placeholder="e.g. 40"
              className="w-full rounded-xl border px-4 py-3 text-base"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: colors.textMuted }}>
              Until
            </label>
            <input
              type="time"
              value={untilValue}
              onChange={(event) => setUntilValue(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-base"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />
          </div>
        )}

        {error ? (
          <p className="mt-3 text-sm text-rose-500">{error}</p>
        ) : (
          <p className="mt-3 text-xs" style={{ color: colors.textMuted }}>
            When time is up you can finish (log the session) or extend. Ignoring the alarm keeps
            tracking.
          </p>
        )}

        <div className="mt-4">
          <ActionButton
            label="Start alarm"
            onClick={handleStart}
            loading={saving}
            disabled={saving}
            className="w-full"
          />
        </div>
      </BottomSheetScroll>
    </BottomSheetModal>
  );
}
