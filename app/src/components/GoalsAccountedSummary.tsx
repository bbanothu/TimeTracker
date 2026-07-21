import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import { useCountUpMs } from '@/hooks/useCountUpMs';
import type { Tag } from '@/types';
import { formatDurationLong } from '@/utils/formatDuration';
import { MAX_ACCOUNTED_DAY_MS, sumAccountedDurationMs } from '@/utils/goalProgress';

interface GoalsAccountedSummaryProps {
  progressByTagId: Map<string, number>;
  tags: Tag[];
}

export function GoalsAccountedSummary({ progressByTagId, tags }: GoalsAccountedSummaryProps) {
  const colors = useAppColors();
  const accountedMs = useMemo(
    () => sumAccountedDurationMs(progressByTagId, tags),
    [progressByTagId, tags],
  );
  const displayMs = useCountUpMs(accountedMs);
  const fillRatio = accountedMs / MAX_ACCOUNTED_DAY_MS;

  return (
    <ThemedSurface className="mb-4 px-4 py-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>
          Accounted today
        </Text>
        <Text className="text-2xl font-bold tabular-nums" style={{ color: colors.textOnBg }}>
          {formatDurationLong(displayMs)}
        </Text>
      </View>

      <View
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: colors.separator }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.round(fillRatio * 100)}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>

      <Text className="mt-1.5 text-xs font-medium" style={{ color: colors.textMuted }}>
        Across categories · max 24h per day
      </Text>
    </ThemedSurface>
  );
}
