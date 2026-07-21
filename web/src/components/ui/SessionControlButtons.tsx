import { play, stop } from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/contexts/ThemeContext';

const CONTROL_SIZE = 20;
const CONTROL_ICON_SIZE = 12;

interface StartSessionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function StartSessionButton({ onClick, disabled, className = '' }: StartSessionButtonProps) {
  const colors = useAppColors();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Start session"
      title="Start session"
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition hover:opacity-80 disabled:opacity-50 ${className}`}
      style={{
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        backgroundColor: colors.primary,
      }}
    >
      <AppIcon icon={play} size={CONTROL_ICON_SIZE} color={colors.textOnPrimary} />
    </button>
  );
}

interface StopSessionButtonProps {
  onClick: () => void;
  className?: string;
}

export function StopSessionButton({ onClick, className = '' }: StopSessionButtonProps) {
  const colors = useAppColors();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Stop session"
      title="Stop session"
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition hover:opacity-80 ${className}`}
      style={{
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        backgroundColor: colors.stop,
      }}
    >
      <AppIcon icon={stop} size={CONTROL_ICON_SIZE} color="#FFFFFF" />
    </button>
  );
}
