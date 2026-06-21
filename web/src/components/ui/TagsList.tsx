import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import type { FlatTagItem } from '@/utils/tagTree';

interface TagsListProps {
  items: FlatTagItem[];
  emptyMessage?: string;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export function TagsList({
  items,
  emptyMessage = 'No tags yet.',
  onEdit,
  onDelete,
}: TagsListProps) {
  const colors = useAppColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (tagId: string) => {
    setExpandedId((current) => (current === tagId ? null : tagId));
  };

  if (items.length === 0) {
    return (
      <p className="py-2 text-center text-sm" style={{ color: colors.textMuted }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ThemedSurface className="overflow-hidden p-0">
      {items.map((item, index) => {
        const expanded = expandedId === item.tag.id;
        const indent = item.depth * 12;

        return (
          <div
            key={item.tag.id}
            style={
              index < items.length - 1
                ? { borderBottom: `1px solid ${colors.surfaceBorder}` }
                : undefined
            }
          >
            <button
              type="button"
              onClick={() => toggleExpanded(item.tag.id)}
              className="flex w-full items-center gap-2 py-2.5 pr-3 text-left transition hover:opacity-90"
              style={{ paddingLeft: 12 + indent }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.tag.color }}
                  />
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: item.tag.color }}
                    title={formatTagName(item.tag.name)}
                  >
                    {formatTagName(item.tag.name)}
                  </span>
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    {expanded ? '▴' : '▾'}
                  </span>
                </div>
                {!expanded && item.depth > 0 ? (
                  <p className="ml-3.5 text-xs" style={{ color: colors.textMuted }}>
                    {item.path}
                  </p>
                ) : null}
              </div>
            </button>

            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out"
              style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3" style={{ paddingLeft: 12 + indent }}>
                  <div className="mb-3">
                    <span
                      className="inline-block rounded-full border px-3 py-1.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: item.tag.color, borderColor: item.tag.color }}
                    >
                      {formatTagName(item.tag.name)}
                    </span>
                    {item.depth > 0 ? (
                      <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                        {item.path}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: item.tag.color, borderColor: colors.surfaceBorder }}
                      />
                      <span className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
                        {item.depth === 0 ? 'Top level' : 'Nested tag'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label="Edit" variant="secondary" onClick={() => onEdit(item.tag)} className="flex-1" />
                    <ActionButton
                      label="Delete"
                      variant="destructiveOutline"
                      onClick={() => onDelete(item.tag)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ThemedSurface>
  );
}
