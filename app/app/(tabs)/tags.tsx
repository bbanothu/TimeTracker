import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollView as ScrollViewType } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { BottomSheetModal, BottomSheetScrollView } from '@/components/BottomSheetModal';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagsList } from '@/components/TagsList';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';
import { TAG_COLOR_OPTIONS } from '@/theme/colors';
import type { Tag } from '@/types';
import { flattenTags, getEligibleParents, wouldCreateCycle } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';

export default function TagsScreen() {
  const { tags, addTag, editTag, removeTag, toggleTagAnalytics } = useTags();
  const colors = useAppColors();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagFormScrollRef = useRef<ScrollViewType>(null);

  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const parentOptions = useMemo(
    () => getEligibleParents(editingTag?.id ?? null, tags),
    [editingTag, tags],
  );
  const selectedParentLabel =
    parentId === null
      ? 'None (top level)'
      : formatTagName(parentOptions.find((item) => item.tag.id === parentId)?.path ?? 'Unknown');

  const resetForm = () => {
    setName('');
    setColor(TAG_COLOR_OPTIONS[0]);
    setParentId(null);
    setDescription('');
    setShowDescription(false);
    setEditingTag(null);
    setError(null);
  };

  const closeTagForm = () => {
    resetForm();
    setParentPickerOpen(false);
    setTagFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setTagFormOpen(true);
  };

  const handleSave = () => {
    try {
      setError(null);
      if (editingTag && parentId && wouldCreateCycle(editingTag.id, parentId, tags)) {
        throw new Error('That parent would create a cycle');
      }
      if (editingTag) {
        editTag(editingTag.id, name, color, parentId, description);
      } else {
        addTag(name, color, parentId, description);
      }
      closeTagForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setParentId(tag.parentId);
    setDescription(tag.description ?? '');
    setShowDescription(Boolean(tag.description));
    setError(null);
    setTagFormOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    try {
      removeTag(tag.id);
      if (editingTag?.id === tag.id) closeTagForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not delete tag');
    }
  };

  return (
    <TabScreenContainer className="px-4 pt-2">
      <TabScrollView className="flex-1" contentContainerClassName="pb-8">
        <ActionButton
          label="Create new tag"
          onPress={openCreateForm}
          variant="secondary"
          size="lg"
          className="mb-4"
        />

        <Text className="mb-2 text-base font-medium" style={{ color: colors.textMuted }}>
        Tags ({flatTags.length})
      </Text>
      <TagsList
        items={flatTags}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleAnalytics={(tag, includeInAnalytics) => toggleTagAnalytics(tag.id, includeInAnalytics)}
      />
      </TabScrollView>

      <BottomSheetModal
        visible={tagFormOpen}
        title={parentPickerOpen ? 'Select parent' : editingTag ? 'Edit tag' : 'New tag'}
        onClose={() => {
          if (parentPickerOpen) {
            setParentPickerOpen(false);
            return;
          }
          closeTagForm();
        }}
        maxHeightFraction={0.9}
      >
        <BottomSheetScrollView
          ref={tagFormScrollRef}
          maxHeightFraction={0.75}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {parentPickerOpen ? (
            <>
              <Pressable
                onPress={() => setParentPickerOpen(false)}
                className="mb-3 flex-row items-center"
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
                <Text className="ml-1 text-base font-semibold" style={{ color: colors.primary }}>
                  Back to tag
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setParentId(null);
                  setParentPickerOpen(false);
                }}
                className="mb-2 rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor:
                    parentId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
                }}
              >
                <Text className="text-lg" style={{ color: colors.text }}>
                  None (top level)
                </Text>
              </Pressable>
              {parentOptions.map((item) => (
                <Pressable
                  key={item.tag.id}
                  onPress={() => {
                    setParentId(item.tag.id);
                    setParentPickerOpen(false);
                  }}
                  className="mb-2 rounded-xl px-4 py-3.5"
                  style={{
                    marginLeft: item.depth * 14,
                    backgroundColor:
                      parentId === item.tag.id ? colors.selectedBgSolid : colors.secondaryBgSolid,
                  }}
                >
                  <Text className="text-lg" style={{ color: colors.text }}>
                    {formatTagName(item.path)}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Text className="mb-2 text-base" style={{ color: colors.textMuted }}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="work"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
                className="mb-3 rounded-xl border px-4 py-3.5 text-lg"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }}
                onFocus={() => {
                  const delay = Platform.OS === 'ios' ? 150 : 0;
                  setTimeout(() => {
                    tagFormScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }, delay);
                }}
              />
              <Text className="mb-2 text-base" style={{ color: colors.textMuted }}>
                Parent tag
              </Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setParentPickerOpen(true);
                }}
                className="mb-3 flex-row items-center justify-between rounded-xl border px-4 py-3.5"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
              >
                <Text className="text-lg" style={{ color: colors.text }}>
                  {selectedParentLabel}
                </Text>
                <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
              </Pressable>
              <Text className="mb-2 text-base" style={{ color: colors.textMuted }}>
                Color
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {TAG_COLOR_OPTIONS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setColor(item)}
                    className={`h-12 w-12 rounded-full ${color === item ? 'border-2' : ''}`}
                    style={{
                      backgroundColor: item,
                      borderColor: color === item ? colors.text : 'transparent',
                    }}
                  />
                ))}
              </ScrollView>
              {showDescription ? (
                <>
                  <Text className="mb-2 text-base" style={{ color: colors.textMuted }}>
                    Description
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Notes about when or how to use this tag"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    textAlignVertical="top"
                    className="mb-4 min-h-[112px] rounded-xl border px-4 py-3.5 text-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </>
              ) : (
                <Pressable
                  onPress={() => setShowDescription(true)}
                  className="mb-4 flex-row items-center self-start"
                  accessibilityRole="button"
                  accessibilityLabel="Add description"
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text className="ml-1 text-base font-semibold" style={{ color: colors.primary }}>
                    Add description
                  </Text>
                </Pressable>
              )}
              {error ? (
                <Text className="mt-3 text-base font-medium" style={{ color: colors.destructive }}>
                  {error}
                </Text>
              ) : null}
              <ActionButton
                label={editingTag ? 'Update' : 'Add tag'}
                onPress={handleSave}
                size="lg"
              />
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </TabScreenContainer>
  );
}
