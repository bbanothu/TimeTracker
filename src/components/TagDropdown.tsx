import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import type { Tag } from '@/types';
import { flattenTags, getTagPath } from '@/utils/tagTree';

interface TagDropdownProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
  disabled?: boolean;
}

export function TagDropdown({ tags, selectedId, onSelect, disabled }: TagDropdownProps) {
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
        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
      >
        <View className="flex-row items-center flex-1">
          {selectedTag ? (
            <>
              <View
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedTag.color }}
              />
              <Text className="text-base font-medium text-slate-900 dark:text-slate-100">
                #{selectedLabel}
              </Text>
            </>
          ) : (
            <Text className="text-base text-slate-500 dark:text-slate-400">
              {tags.length === 0 ? 'Add tags first' : 'Select activity'}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="max-h-[60%] rounded-t-3xl bg-white px-4 pb-8 pt-4 dark:bg-slate-900"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Select activity
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <FlatList
              data={flatTags}
              keyExtractor={(item) => item.tag.id}
              ListEmptyComponent={
                <Text className="py-6 text-center text-slate-500 dark:text-slate-400">
                  No tags yet. Add some on the Tags tab.
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.tag.id === selectedId;

                return (
                  <Pressable
                    onPress={() => handleSelect(item.tag.id)}
                    className={`mb-2 flex-row items-center justify-between rounded-xl px-4 py-3 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950' : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                    style={{ marginLeft: item.depth * 12 }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="mr-3 h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.tag.color }}
                      />
                      <Text className="text-base font-medium text-slate-900 dark:text-slate-100">
                        #{item.path}
                      </Text>
                    </View>
                    {isSelected ? <Ionicons name="checkmark" size={20} color="#2563EB" /> : null}
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
