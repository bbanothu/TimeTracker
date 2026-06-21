import { Pressable, Text, View } from 'react-native';

import type { PeriodType } from '@/types';
import { formatPeriodLabel } from '@/utils/periodBounds';

interface PeriodSelectorProps {
  period: PeriodType;
  anchorDate: Date;
  onPeriodChange: (period: PeriodType) => void;
  onShift: (delta: number) => void;
}

const PERIODS: PeriodType[] = ['day', 'week', 'month'];

export function PeriodSelector({
  period,
  anchorDate,
  onPeriodChange,
  onShift,
}: PeriodSelectorProps) {
  return (
    <View className="mb-4">
      <View className="mb-3 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {PERIODS.map((item) => (
          <Pressable
            key={item}
            onPress={() => onPeriodChange(item)}
            className={`flex-1 rounded-lg py-2 ${period === item ? 'bg-white dark:bg-slate-900' : ''}`}
          >
            <Text
              className={`text-center text-sm font-semibold capitalize ${
                period === item
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onShift(-1)}
          className="rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
        >
          <Text className="font-semibold text-slate-700 dark:text-slate-200">Prev</Text>
        </Pressable>
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {formatPeriodLabel(anchorDate, period)}
        </Text>
        <Pressable
          onPress={() => onShift(1)}
          className="rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
        >
          <Text className="font-semibold text-slate-700 dark:text-slate-200">Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
