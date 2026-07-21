import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface HistoryPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function HistoryPagination({ page, totalPages, onPageChange }: HistoryPaginationProps) {
  const colors = useAppColors();

  if (totalPages <= 1) return null;

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <View
      className="mt-4 flex-row items-center justify-between rounded-xl px-3 py-2"
      style={{ backgroundColor: colors.surface }}
    >
      <Pressable
        onPress={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        className="rounded-lg px-3 py-2"
        style={{ opacity: canPrev ? 1 : 0.4 }}
      >
        <Text className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          ← Prev
        </Text>
      </Pressable>

      <Text className="text-sm font-medium" style={{ color: colors.text }}>
        Page {page + 1} of {totalPages}
      </Text>

      <Pressable
        onPress={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        accessibilityRole="button"
        accessibilityLabel="Next page"
        className="rounded-lg px-3 py-2"
        style={{ opacity: canNext ? 1 : 0.4 }}
      >
        <Text className="text-sm font-semibold" style={{ color: colors.textMuted }}>
          Next →
        </Text>
      </Pressable>
    </View>
  );
}
