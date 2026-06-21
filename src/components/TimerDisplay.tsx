import { Text, View } from 'react-native';

import { formatDuration } from '@/utils/formatDuration';

interface TimerDisplayProps {
  startedAt: number | null;
  isRunning: boolean;
}

export function TimerDisplay({ startedAt, isRunning }: TimerDisplayProps) {
  const elapsed = startedAt ? Date.now() - startedAt : 0;

  return (
    <View className="items-center py-6">
      <Text className="font-mono text-5xl font-bold text-slate-900 dark:text-slate-100">
        {formatDuration(elapsed)}
      </Text>
      <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {isRunning ? 'Tracking now' : 'Ready to track'}
      </Text>
    </View>
  );
}
