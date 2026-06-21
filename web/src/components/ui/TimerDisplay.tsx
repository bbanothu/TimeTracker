import { useAppColors } from '@/contexts/ThemeContext';
import { formatDuration } from '@/utils/formatDuration';

interface TimerDisplayProps {
  startedAt: number | null;
  isRunning: boolean;
}

export function TimerDisplay({ startedAt, isRunning }: TimerDisplayProps) {
  const colors = useAppColors();
  const elapsed = startedAt ? Date.now() - startedAt : 0;

  return (
    <div className="mb-6 text-center">
      <div className="font-mono text-5xl font-bold tracking-tight" style={{ color: colors.textOnBg }}>
        {formatDuration(elapsed)}
      </div>
      <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {isRunning ? 'Tracking now' : 'Ready to track'}
      </p>
    </div>
  );
}
