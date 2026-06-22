import { Text, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
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
      <Text className="py-4 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden">
      {scores.map((score, index) => (
        <View
          key={score.id}
          className="flex-row items-center justify-between px-3 py-3"
          style={{
            borderBottomWidth: index < scores.length - 1 ? 1 : 0,
            borderBottomColor: colors.surfaceBorder,
          }}
        >
          <Text className="text-sm font-medium" style={{ color: colors.textOnBg }}>
            {formatScoreDateLabel(score.dateKey, score.isLive)}
          </Text>
          <Text className="text-sm font-semibold tabular-nums" style={{ color: colors.textOnBg }}>
            {formatGoalPercent(score.scorePercent)}
          </Text>
        </View>
      ))}
    </ThemedSurface>
  );
}
