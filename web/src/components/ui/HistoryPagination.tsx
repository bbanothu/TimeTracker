import { useAppColors } from '@/contexts/ThemeContext';

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
    <div
      className="mt-4 flex items-center justify-between rounded-xl border px-3 py-2"
      style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className="rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40"
        style={{ color: colors.textMuted }}
      >
        ← Prev
      </button>

      <p className="text-sm font-medium" style={{ color: colors.text }}>
        Page {page + 1} of {totalPages}
      </p>

      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className="rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40"
        style={{ color: colors.textMuted }}
      >
        Next →
      </button>
    </div>
  );
}
