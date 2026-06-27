import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheetModal, BottomSheetScrollView } from '@/components/BottomSheetModal';
import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';
import { flattenTags, getTagPath } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';

interface TagDropdownProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
  disabled?: boolean;
}

export function TagDropdown({ tags, selectedId, onSelect, disabled }: TagDropdownProps) {
  const colors = useAppColors();
  const [open, setOpen] = useState(false);
  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const selectedTag = tags.find((tag) => tag.id === selectedId) ?? null;
  const selectedLabel = selectedTag ? getTagPath(selectedTag.id, tags) : null;

  const handleSelect = (tagId: string) => {
    onSelect(tagId);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        disabled={disabled || tags.length === 0}
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border px-4 py-3"
        style={{
          backgroundColor: colors.inputBgSolid,
          borderColor: colors.inputBorder,
        }}
      >
        <View className="flex-1 flex-row items-center">
          {selectedTag ? (
            <>
              <View
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {formatTagName(selectedLabel ?? '')}
              </Text>
            </>
          ) : (
            <Text className="text-base font-medium" style={{ color: colors.text }}>
              {tags.length === 0 ? 'Add tags first' : 'Select activity'}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      <BottomSheetModal visible={open} title="Select activity" onClose={() => setOpen(false)}>
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {flatTags.length === 0 ? (
            <Text className="py-6 text-center" style={{ color: colors.textMuted }}>
              No tags yet. Add some on the Tags tab.
            </Text>
          ) : (
            flatTags.map((item) => {
              const isSelected = item.tag.id === selectedId;

              return (
                <Pressable
                  key={item.tag.id}
                  onPress={() => handleSelect(item.tag.id)}
                  className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    marginLeft: item.depth * 12,
                    backgroundColor: isSelected ? colors.selectedBgSolid : colors.secondaryBgSolid,
                  }}
                >
                  <View className="flex-1 flex-row items-center">
                    <View
                      className="mr-3 h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.tag.color }}
                    />
                    <Text className="text-base font-medium" style={{ color: colors.text }}>
                      {formatTagName(item.path)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}
