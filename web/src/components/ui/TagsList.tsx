import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import { confirmDelete } from '@/lib/confirm';
import type { Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import type { FlatTagItem } from '@/utils/tagTree';

interface TagsListProps {
  items: FlatTagItem[];
  emptyMessage?: string;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onToggleAnalytics: (tag: Tag, includeInAnalytics: boolean) => void;
}

function EditIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TagsList({
  items,
  emptyMessage = 'No tags yet.',
  onEdit,
  onDelete,
  onToggleAnalytics,
}: TagsListProps) {
  const colors = useAppColors();

  if (items.length === 0) {
    return (
      <p className="py-2 text-center text-base" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {items.map((item, index) => {
        const indent = item.depth * 14;
        const included = item.tag.includeInAnalytics !== false;
        const label = formatTagName(item.tag.name);
        const pathLabel = item.depth > 0 ? formatTagName(item.path) : label;

        return (
          <div
            key={item.tag.id}
            className="flex items-center gap-2.5 py-3.5 pr-3"
            style={{
              paddingLeft: 14 + indent,
              borderBottom:
                index < items.length - 1 ? `1px solid ${colors.surfaceBorder}` : undefined,
            }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.tag.color }}
            />
            <span
              className="min-w-0 flex-1 truncate text-base font-semibold"
              style={{ color: included ? colors.textOnBg : colors.textMuted }}
              title={pathLabel}
            >
              {label}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={included}
              aria-label="Include in analytics"
              title={included ? 'Shown in analytics' : 'Hidden from analytics'}
              onClick={() => onToggleAnalytics(item.tag, !included)}
              className="relative h-6 w-11 shrink-0 rounded-full border transition"
              style={{
                backgroundColor: included ? colors.primary : colors.secondaryBg,
                borderColor: included ? colors.primary : colors.surfaceBorder,
              }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                style={{ left: included ? '26px' : '2px' }}
              />
            </button>
            <button
              type="button"
              aria-label={`Edit ${label}`}
              title="Edit"
              onClick={() => onEdit(item.tag)}
              className="shrink-0 rounded p-1.5 transition hover:opacity-80"
            >
              <EditIcon color={colors.textMuted} />
            </button>
            <button
              type="button"
              aria-label={`Delete ${label}`}
              title="Delete"
              onClick={() => {
                if (!confirmDelete(`Remove ${label}? This cannot be undone.`)) return;
                onDelete(item.tag);
              }}
              className="shrink-0 rounded p-1.5 transition hover:opacity-80"
            >
              <DeleteIcon color={colors.destructiveText} />
            </button>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
