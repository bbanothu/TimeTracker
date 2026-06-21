import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import type { Tag } from '@/types';
import { flattenTags, getTagPath } from '@/utils/tagTree';

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
        style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
      >
        <View className="flex-1 flex-row items-center">
          {selectedTag ? (
            <>
              <View
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                #{selectedLabel}
              </Text>
            </>
          ) : (
            <Text className="text-base" style={{ color: colors.textMuted }}>
              {tags.length === 0 ? 'Add tags first' : 'Select activity'}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="max-h-[60%] rounded-t-3xl px-4 pb-8 pt-4"
            style={{ backgroundColor: colors.surface }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Select activity
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <FlatList
              data={flatTags}
              keyExtractor={(item) => item.tag.id}
              ListEmptyComponent={
                <Text className="py-6 text-center" style={{ color: colors.textMuted }}>
                  No tags yet. Add some on the Tags tab.
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.tag.id === selectedId;

                return (
                  <Pressable
                    onPress={() => handleSelect(item.tag.id)}
                    className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      marginLeft: item.depth * 12,
                      backgroundColor: isSelected ? colors.selectedBg : colors.secondaryBg,
                    }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="mr-3 h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.tag.color }}
                      />
                      <Text className="text-base font-medium" style={{ color: colors.text }}>
                        #{item.path}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
