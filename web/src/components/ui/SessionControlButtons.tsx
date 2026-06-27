import { useAppColors } from '@/contexts/ThemeContext';

function PlayIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5Z" fill={color} />
    </svg>
  );
}

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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[2.5px] transition hover:opacity-80 disabled:opacity-50 ${className}`}
      style={{
        width: 48,
        height: 48,
        borderColor: colors.primary,
        backgroundColor: 'transparent',
      }}
    >
      <span className="ml-0.5">
        <PlayIcon color={colors.primary} />
      </span>
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[2.5px] transition hover:opacity-80 ${className}`}
      style={{
        width: 40,
        height: 40,
        borderColor: colors.stop,
        backgroundColor: 'transparent',
      }}
    >
      <span
        className="rounded-[2.5px]"
        style={{
          width: 14,
          height: 14,
          backgroundColor: colors.stop,
        }}
      />
    </button>
  );
}
