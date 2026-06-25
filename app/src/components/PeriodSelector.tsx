import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import type { PeriodType } from '@/types';
import { formatPeriodLabel } from '@/utils/periodBounds';

const PERIODS: PeriodType[] = ['day', 'week', 'month'];

interface PeriodSelectorProps {
  period: PeriodType;
  anchorDate: Date;
  onPeriodChange: (period: PeriodType) => void;
  onShift: (delta: number) => void;
  onProgressPress?: () => void;
  progressDisabled?: boolean;
}

export function PeriodSelector({
  period,
  anchorDate,
  onPeriodChange,
  onShift,
  onProgressPress,
  progressDisabled = false,
}: PeriodSelectorProps) {
  const colors = useAppColors();

  return (
    <View className="mb-4">
      <View
        className="mb-3 flex-row rounded-xl p-1"
        style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 }}
      >
        {PERIODS.map((item) => {
          const selected = period === item;
          return (
            <Pressable
              key={item}
              onPress={() => onPeriodChange(item)}
              className="flex-1 rounded-lg py-2"
              style={{ backgroundColor: selected ? colors.selectedBg : 'transparent' }}
            >
              <Text
                className="text-center text-sm font-semibold capitalize"
                style={{ color: selected ? colors.selectedText : colors.textMuted }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
        {onProgressPress || progressDisabled ? (
          progressDisabled ? (
            <View className="flex-1 rounded-lg py-2">
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: colors.textDisabled }}
              >
                Progress
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onProgressPress}
              className="flex-1 rounded-lg py-2"
              style={{ backgroundColor: 'transparent' }}
            >
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: colors.textMuted }}
              >
                Progress
              </Text>
            </Pressable>
          )
        ) : null}
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onShift(-1)}
          className="rounded-full px-4 py-2"
          style={{ backgroundColor: colors.secondaryBg }}
        >
          <Text className="font-semibold" style={{ color: colors.textOnBg }}>
            Prev
          </Text>
        </Pressable>
        <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          {formatPeriodLabel(anchorDate, period)}
        </Text>
        <Pressable
          onPress={() => onShift(1)}
          className="rounded-full px-4 py-2"
          style={{ backgroundColor: colors.secondaryBg }}
        >
          <Text className="font-semibold" style={{ color: colors.textOnBg }}>
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
