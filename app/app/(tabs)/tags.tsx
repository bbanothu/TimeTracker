import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { TagsList } from '@/components/TagsList';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import { useTags } from '@/hooks/useTags';
import { TAG_COLOR_OPTIONS } from '@/theme/colors';
import type { Tag } from '@/types';
import { flattenTags, getEligibleParents } from '@/utils/tagTree';

export default function TagsScreen() {
  const { tags, addTag, editTag, removeTag } = useTags();
  const colors = useAppColors();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const parentOptions = useMemo(
    () => getEligibleParents(editingTag?.id ?? null, tags),
    [editingTag, tags],
  );
  const selectedParentLabel =
    parentId === null
      ? 'None (top level)'
      : (parentOptions.find((item) => item.tag.id === parentId)?.path ?? 'Unknown');

  const resetForm = () => {
    setName('');
    setColor(colors.primary);
    setParentId(null);
    setEditingTag(null);
  };

  const handleSave = () => {
    try {
      if (editingTag) {
        editTag(editingTag.id, name, color, parentId);
      } else {
        addTag(name, color, parentId);
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setParentId(tag.parentId);
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('Delete tag', `Remove #${tag.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            removeTag(tag.id);
            if (editingTag?.id === tag.id) resetForm();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not delete tag');
          }
        },
      },
    ]);
  };

  return (
    <TabScreenContainer className="px-4 pt-2">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
      <ThemedSurface className="mb-4 p-4">
        <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
          {editingTag ? 'Edit tag' : 'New tag'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="work"
          placeholderTextColor={colors.inputPlaceholder}
          autoCapitalize="none"
          className="mb-3 rounded-xl border px-4 py-3 text-base"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
        <Text className="mb-2 text-sm" style={{ color: colors.textMuted }}>
          Parent tag
        </Text>
        <Pressable
          onPress={() => setParentPickerOpen(true)}
          className="mb-3 flex-row items-center justify-between rounded-xl border px-4 py-3"
          style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
        >
          <Text className="text-base" style={{ color: colors.text }}>
            {selectedParentLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
        <Text className="mb-2 text-sm" style={{ color: colors.textMuted }}>
          Color
        </Text>
        <View className="mb-4 flex-row flex-wrap">
          {TAG_COLOR_OPTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              className={`mr-2 mb-2 h-10 w-10 rounded-full ${color === item ? 'border-2' : ''}`}
              style={{
                backgroundColor: item,
                borderColor: color === item ? colors.text : 'transparent',
              }}
            />
          ))}
        </View>
        <View className="flex-row gap-3">
          <ActionButton
            label={editingTag ? 'Update' : 'Add tag'}
            onPress={handleSave}
            className="flex-1"
          />
          {editingTag ? (
            <ActionButton label="Cancel" onPress={resetForm} variant="secondary" />
          ) : null}
        </View>
      </ThemedSurface>

      <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Tags ({flatTags.length})
      </Text>
      <TagsList items={flatTags} onEdit={handleEdit} onDelete={handleDelete} />
      </ScrollView>

      <Modal
        visible={parentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setParentPickerOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setParentPickerOpen(false)}>
          <Pressable
            className="max-h-[50%] rounded-t-3xl px-4 pb-8 pt-4"
            style={{ backgroundColor: colors.surface }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-4 text-lg font-semibold" style={{ color: colors.text }}>
              Select parent
            </Text>
            <Pressable
              onPress={() => {
                setParentId(null);
                setParentPickerOpen(false);
              }}
              className="mb-2 rounded-xl px-4 py-3"
              style={{
                backgroundColor: parentId === null ? colors.selectedBg : colors.secondaryBg,
              }}
            >
              <Text className="text-base" style={{ color: colors.text }}>
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
                className="mb-2 rounded-xl px-4 py-3"
                style={{
                  marginLeft: item.depth * 12,
                  backgroundColor:
                    parentId === item.tag.id ? colors.selectedBg : colors.secondaryBg,
                }}
              >
                <Text className="text-base" style={{ color: colors.text }}>
                  {item.path}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </TabScreenContainer>
  );
}
