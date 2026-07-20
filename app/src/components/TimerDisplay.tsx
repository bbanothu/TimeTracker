import { Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { formatDuration } from '@/utils/formatDuration';

interface TimerDisplayProps {
  startedAt: number | null;
  isRunning: boolean;
}

export function TimerDisplay({ startedAt, isRunning }: TimerDisplayProps) {
  const colors = useAppColors();
  const elapsed = startedAt ? Date.now() - startedAt : 0;

  return (
    <View className="items-center py-6">
      <Text className="font-mono text-5xl font-bold" style={{ color: colors.textOnBg }}>
        {formatDuration(elapsed)}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        {isRunning ? 'Tracking now' : 'Ready to track'}
      </Text>
    </View>
  );
}
