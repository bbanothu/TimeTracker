import { useEffect, useState } from 'react';
import { checkmarkOutline } from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useAppColors } from '@/contexts/ThemeContext';

interface StopSessionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (details: string) => void | Promise<void>;
  saving?: boolean;
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
        <LoadingIndicator size={22} />
      ) : (
        <AppIcon icon={checkmarkOutline} size={22} color={colors.primary} />
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
