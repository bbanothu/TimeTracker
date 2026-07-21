import { Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { formatDuration } from '@/utils/formatDuration';

interface TimerDisplayProps {
  elapsedMs: number;
  isRunning: boolean;
}

export function TimerDisplay({ elapsedMs, isRunning }: TimerDisplayProps) {
  const colors = useAppColors();

  return (
    <View className="items-center py-4">
      <Text
        className="font-mono text-6xl font-light tracking-tight tabular-nums"
        style={{ color: colors.textOnBg }}
      >
        {formatDuration(elapsedMs)}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {isRunning ? 'Tracking' : 'Ready to track'}
      </Text>
    </View>
  );
}
