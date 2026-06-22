import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import {
  formatGoalPercent,
  formatScoreDateLabel,
  type DailyGoalScoreDisplay,
} from '@/utils/goalProgressHistory';

interface DailyGoalScoreListProps {
  scores: DailyGoalScoreDisplay[];
  emptyMessage?: string;
}

export function DailyGoalScoreList({
  scores,
  emptyMessage = 'Set daily goals on the Goals tab to track your progress here.',
}: DailyGoalScoreListProps) {
  const colors = useAppColors();

  if (scores.length === 0) {
    return (
      <p className="py-4 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {scores.map((score, index) => (
        <div
          key={score.id}
          className="flex items-center justify-between px-3 py-3"
          style={{
            borderBottomWidth: index < scores.length - 1 ? 1 : 0,
            borderBottomColor: colors.surfaceBorder,
          }}
        >
          <span className="text-sm font-medium" style={{ color: colors.textOnBg }}>
            {formatScoreDateLabel(score.dateKey, score.isLive)}
          </span>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: colors.textOnBg }}
          >
            {formatGoalPercent(score.scorePercent)}
          </span>
        </div>
      ))}
    </ThemedSurface>
  );
}
