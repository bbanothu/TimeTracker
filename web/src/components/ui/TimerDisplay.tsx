import { useAppColors } from '@/contexts/ThemeContext';
import { formatDuration } from '@/utils/formatDuration';

interface TimerDisplayProps {
  elapsedMs: number;
  isRunning: boolean;
}

export function TimerDisplay({ elapsedMs, isRunning }: TimerDisplayProps) {
  const colors = useAppColors();

  return (
    <div className="mb-6 py-4 text-center">
      <div
        className="font-mono text-6xl font-light tracking-tight tabular-nums"
        style={{ color: colors.textOnBg }}
      >
        {formatDuration(elapsedMs)}
      </div>
      <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {isRunning ? 'Tracking' : 'Ready to track'}
      </p>
    </div>
  );
}
