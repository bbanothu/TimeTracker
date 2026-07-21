import { FormEvent, useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useAppColors } from '@/contexts/ThemeContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export function DeleteAccountModal({ visible, onClose, onConfirm }: DeleteAccountModalProps) {
  const colors = useAppColors();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPassword('');
    setError(null);
    setDeleting(false);
  }, [visible]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (deleting) return;

    try {
      setError(null);
      setDeleting(true);
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account');
      setDeleting(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Delete account"
      onClose={deleting ? () => undefined : onClose}
      maxHeightFraction={0.7}
      zIndexClass="z-[9999]"
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <p className="mb-3 text-sm leading-6" style={{ color: colors.textOnBg }}>
          This permanently deletes your account and all related data — sessions, tags, places,
          goals, friends, calendar connection, and profile photo. This cannot be undone.
        </p>
        <p className="mb-4 text-sm leading-6" style={{ color: colors.textMuted }}>
          Enter your password to confirm.
        </p>

        <label className="mb-1 block text-xs font-medium" style={{ color: colors.textSecondary }}>
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={deleting}
          className="mb-3 w-full rounded-xl border px-4 py-2.5 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />

        {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            label="Cancel"
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
            className="w-full sm:w-auto"
          />
          <ActionButton
            type="submit"
            label="Delete account"
            variant="destructive"
            loading={deleting}
            disabled={deleting || password.trim().length === 0}
            className="w-full sm:w-auto"
          />
        </div>
      </form>
    </BottomSheetModal>
  );
}
