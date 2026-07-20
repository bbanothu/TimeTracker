import { useAppColors } from '@/contexts/ThemeContext';
import type { TagDuration } from '@/types';
import { formatDurationLong, formatTagName } from '@/utils/formatDuration';

interface TagLegendProps {
  items: TagDuration[];
  className?: string;
}

export function TagLegend({ items, className = 'mt-4 w-full' }: TagLegendProps) {
  const colors = useAppColors();

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.tag.id} className="mb-2 flex items-center justify-between">
          <div className="mr-2 flex min-w-0 flex-1 items-center">
            <span
              className="mr-2 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <span className="truncate text-sm" style={{ color: colors.textSecondary }}>
              {formatTagName(item.tag.name)}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {formatDurationLong(item.durationMs)}
          </span>
        </div>
      ))}
    </div>
  );
}
