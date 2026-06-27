import { useEffect, useState } from 'react';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useAppColors } from '@/contexts/ThemeContext';

interface StopSessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (details: string) => void | Promise<void>;
  saving?: boolean;
}

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

export function StopSessionDetailsModal({
  visible,
  onClose,
  onSave,
  saving = false,
}: StopSessionDetailsModalProps) {
  const colors = useAppColors();
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDetails('');
  }, [visible]);

  const handleSave = () => {
    if (saving) return;
    void Promise.resolve(onSave(details.trim()));
  };

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      aria-label="Save details"
      title="Save"
      className="rounded-full p-1 transition hover:opacity-80 disabled:opacity-50"
    >
      {saving ? (
        <span
          className="inline-block h-[22px] w-[22px] animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
        />
      ) : (
        <SaveIcon color={colors.primary} />
      )}
    </button>
  );

  return (
    <BottomSheetModal
      visible={visible}
      title="Details"
      onClose={onClose}
      headerActions={saveButton}
      maxHeightFraction={0.5}
    >
      <p className="mb-2 text-sm" style={{ color: colors.textMuted }}>
        Add a note about this session (optional).
      </p>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="What did you work on?"
        rows={4}
        className="w-full resize-none rounded-xl border px-4 py-3 text-base"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      />
    </BottomSheetModal>
  );
}
