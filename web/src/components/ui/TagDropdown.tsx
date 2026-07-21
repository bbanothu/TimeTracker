import { useState } from 'react';
import { chevronDown } from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { filterDisplayTags } from '@/constants/defaultPlace';
import { useAppColors } from '@/contexts/ThemeContext';
import { useFlatTagsByUsage } from '@/hooks/useFlatTagsByUsage';
import type { Tag } from '@/types';
import { getTagPath } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';
import { analyticsIncludedTags } from '@/utils/tagAnalytics';

interface TagDropdownProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
}

export function TagDropdown({ tags, selectedId, onSelect }: TagDropdownProps) {
  const colors = useAppColors();
  const [open, setOpen] = useState(false);
  const displayTags = filterDisplayTags(tags);
  const selectableTags = (() => {
    const included = analyticsIncludedTags(displayTags);
    if (!selectedId || included.some((tag) => tag.id === selectedId)) return included;
    const selected = displayTags.find((tag) => tag.id === selectedId);
    return selected ? [...included, selected] : included;
  })();
  const flatTags = useFlatTagsByUsage(selectableTags);
  const selectedTag = selectableTags.find((tag) => tag.id === selectedId) ?? null;
  const selectedLabel = selectedTag ? getTagPath(selectedTag.id, tags) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={selectableTags.length === 0}
        className="flex w-full items-center justify-between rounded-xl border px-4 py-1.5 text-left disabled:opacity-100"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedTag ? (
            <>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              <span className="truncate">{formatTagName(selectedLabel ?? '')}</span>
            </>
          ) : (
            <span>{selectableTags.length === 0 ? 'Add tags first' : 'Select activity'}</span>
          )}
        </span>
        <AppIcon icon={chevronDown} size={18} color={colors.textMuted} />
      </button>

      <BottomSheetModal
        visible={open}
        title="Select activity"
        onClose={() => setOpen(false)}
        zIndexClass="z-[9999]"
      >
        <BottomSheetScroll>
          {flatTags.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: colors.textMuted }}>
              No tags yet. Add some on the Tags tab.
            </p>
          ) : (
            <div className="space-y-2 pb-2">
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
                      backgroundColor: selected ? colors.selectedBgSolid : colors.secondaryBgSolid,
                      color: colors.text,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.tag.color }}
                      />
                      {formatTagName(item.path)}
                    </span>
                    {selected ? '✓' : null}
                  </button>
                );
              })}
            </div>
          )}
        </BottomSheetScroll>
      </BottomSheetModal>
    </>
  );
}
