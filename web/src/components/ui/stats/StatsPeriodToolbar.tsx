import { useNavigate } from 'react-router-dom';

import { useAppColors } from '@/contexts/ThemeContext';
import type { PeriodType } from '@/types';
import { formatPeriodLabel, shiftPeriod } from '@/utils/periodBounds';

interface StatsPeriodToolbarProps {
  period: PeriodType;
  anchorDate: Date;
  isViewingFriend: boolean;
  onPeriodChange: (period: PeriodType) => void;
  onAnchorDateChange: (date: Date) => void;
}

export function StatsPeriodToolbar({
  period,
  anchorDate,
  isViewingFriend,
  onPeriodChange,
  onAnchorDateChange,
}: StatsPeriodToolbarProps) {
  const colors = useAppColors();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div
        className="inline-flex rounded-xl border p-1"
        style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}
      >
        {(['day', 'week', 'month'] as PeriodType[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPeriodChange(item)}
            className="rounded-lg px-3 py-2 text-sm font-semibold capitalize lg:px-4"
            style={{
              backgroundColor: period === item ? colors.selectedBg : 'transparent',
              color: period === item ? colors.selectedText : colors.textMuted,
            }}
          >
            {item}
          </button>
        ))}
        {isViewingFriend ? (
          <span
            className="rounded-lg px-3 py-2 text-center text-sm font-semibold lg:px-4"
            style={{ color: colors.textDisabled }}
            title="Progress is only available for your own stats"
          >
            Progress
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/stats/progress?date=${encodeURIComponent(anchorDate.toISOString())}&period=${period}`,
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold lg:px-4"
            style={{ color: colors.textMuted }}
          >
            Progress
          </button>
        )}
      </div>

      <div
        className="inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-1.5 sm:min-w-[220px]"
        style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}
      >
        <button
          type="button"
          onClick={() => onAnchorDateChange(shiftPeriod(anchorDate, period, -1))}
          className="rounded-lg px-2 py-1 text-sm font-semibold"
          style={{ color: colors.textMuted }}
          aria-label="Previous period"
        >
          ←
        </button>
        <p className="text-sm font-medium" style={{ color: colors.text }}>
          {formatPeriodLabel(anchorDate, period)}
        </p>
        <button
          type="button"
          onClick={() => onAnchorDateChange(shiftPeriod(anchorDate, period, 1))}
          className="rounded-lg px-2 py-1 text-sm font-semibold"
          style={{ color: colors.textMuted }}
          aria-label="Next period"
        >
          →
        </button>
      </div>
    </div>
  );
}
