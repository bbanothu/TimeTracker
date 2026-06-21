import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { TagChip } from '@/components/TagChip';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/types';
import { flattenTags, getEligibleParents } from '@/utils/tagTree';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

export default function TagsScreen() {
  const { tags, addTag, editTag, removeTag } = useTags();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
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
    setColor(COLORS[0]);
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
    <View className="flex-1 bg-slate-50 px-4 pt-2 dark:bg-slate-950">
      <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {editingTag ? 'Edit tag' : 'New tag'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="work"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400">Parent tag</Text>
        <Pressable
          onPress={() => setParentPickerOpen(true)}
          className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
        >
          <Text className="text-base text-slate-900 dark:text-slate-100">{selectedParentLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </Pressable>
        <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400">Color</Text>
        <View className="mb-4 flex-row flex-wrap">
          {COLORS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              className={`mr-2 mb-2 h-10 w-10 rounded-full ${
                color === item ? 'border-2 border-slate-900 dark:border-slate-100' : ''
              }`}
              style={{ backgroundColor: item }}
            />
          ))}
        </View>
        <View className="flex-row gap-3">
          <Pressable onPress={handleSave} className="flex-1 rounded-xl bg-blue-600 py-3">
            <Text className="text-center font-semibold text-white">
              {editingTag ? 'Update' : 'Add tag'}
            </Text>
          </Pressable>
          {editingTag ? (
            <Pressable onPress={resetForm} className="rounded-xl bg-slate-200 px-4 py-3 dark:bg-slate-700">
              <Text className="font-semibold text-slate-700 dark:text-slate-200">Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={flatTags}
        keyExtractor={(item) => item.tag.id}
        renderItem={({ item }) => (
          <View
            className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-slate-900"
            style={{ marginLeft: item.depth * 16 }}
          >
            <View className="flex-1 mr-2">
              <TagChip tag={item.tag} />
              {item.depth > 0 ? (
                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.path}</Text>
              ) : null}
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleEdit(item.tag)}
                className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800"
              >
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item.tag)}
                className="rounded-lg bg-rose-100 px-3 py-2 dark:bg-rose-950"
              >
                <Text className="text-sm font-medium text-rose-700 dark:text-rose-300">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-slate-500 dark:text-slate-400">No tags yet.</Text>
        }
      />

      <Modal
        visible={parentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setParentPickerOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setParentPickerOpen(false)}>
          <Pressable
            className="max-h-[50%] rounded-t-3xl bg-white px-4 pb-8 pt-4 dark:bg-slate-900"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Select parent
            </Text>
            <Pressable
              onPress={() => {
                setParentId(null);
                setParentPickerOpen(false);
              }}
              className={`mb-2 rounded-xl px-4 py-3 ${
                parentId === null ? 'bg-blue-50 dark:bg-blue-950' : 'bg-slate-50 dark:bg-slate-800'
              }`}
            >
              <Text className="text-base text-slate-900 dark:text-slate-100">None (top level)</Text>
            </Pressable>
            {parentOptions.map((item) => (
              <Pressable
                key={item.tag.id}
                onPress={() => {
                  setParentId(item.tag.id);
                  setParentPickerOpen(false);
                }}
                className={`mb-2 rounded-xl px-4 py-3 ${
                  parentId === item.tag.id
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'bg-slate-50 dark:bg-slate-800'
                }`}
                style={{ marginLeft: item.depth * 12 }}
              >
                <Text className="text-base text-slate-900 dark:text-slate-100">{item.path}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
