import { useMemo, useState } from 'react';

import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag } from '@/types';
import { flattenTags, getTagPath } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';

interface TagDropdownProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
}

export function TagDropdown({ tags, selectedId, onSelect }: TagDropdownProps) {
  const colors = useAppColors();
  const [open, setOpen] = useState(false);
  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const selectedTag = tags.find((tag) => tag.id === selectedId) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={tags.length === 0}
        className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left"
        style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
      >
        <span>
          {selectedTag ? formatTagName(getTagPath(selectedTag.id, tags)) : tags.length === 0 ? 'Add tags first' : 'Select activity'}
        </span>
        <span style={{ color: colors.textMuted }}>▾</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <ThemedSurface className="max-h-[70vh] w-full max-w-md overflow-hidden p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Select activity
              </h3>
              <button type="button" onClick={() => setOpen(false)} style={{ color: colors.textMuted }}>
                ✕
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {flatTags.map((item) => {
                const selected = item.tag.id === selectedId;
                return (
                  <button
                    key={item.tag.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.tag.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left"
                    style={{
                      marginLeft: item.depth * 12,
                      backgroundColor: selected ? colors.selectedBg : colors.secondaryBg,
                      color: colors.text,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.tag.color }} />
                      {formatTagName(item.path)}
                    </span>
                    {selected ? '✓' : null}
                  </button>
                );
              })}
            </div>
          </ThemedSurface>
        </div>
      ) : null}
    </>
  );
}
