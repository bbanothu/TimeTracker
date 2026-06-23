import { FormEvent, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { TagsList } from '@/components/ui/TagsList';
import { TAG_COLOR_OPTIONS } from '@/theme/colors';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import type { Tag } from '@/types';
import { flattenTags, getEligibleParents, wouldCreateCycle } from '@/utils/tagTree';
import { formatTagName } from '@/utils/formatDuration';

export function TagsPage() {
  const colors = useAppColors();
  const { tags, loading, addTag, editTag, removeTag, toggleTagAnalytics } = useTags();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleModalClose = () => {
    if (parentPickerOpen) {
      setParentPickerOpen(false);
      return;
    }
    closeTagForm();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (editingTag && parentId && wouldCreateCycle(editingTag.id, parentId, tags)) {
        throw new Error('That parent would create a cycle');
      }
      if (editingTag) await editTag(editingTag.id, name, color, parentId);
      else await addTag(name, color, parentId);
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
    setError(null);
    setTagFormOpen(true);
  };

  const handleDelete = async (tag: Tag) => {
    try {
      setError(null);
      await removeTag(tag.id);
      if (editingTag?.id === tag.id) closeTagForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete tag');
    }
  };

  if (loading) {
    return <p style={{ color: colors.textMuted }}>Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold" style={{ color: colors.headerText }}>
        Tags
      </h1>

      <ActionButton
        label="Create new tag"
        type="button"
        variant="secondary"
        onClick={openCreateForm}
        className="mb-4 w-full"
      />

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Tags ({flatTags.length})
      </p>
      <TagsList
        items={flatTags}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleAnalytics={(tag, includeInAnalytics) => {
          toggleTagAnalytics(tag.id, includeInAnalytics).catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not update tag');
          });
        }}
      />

      <BottomSheetModal
        visible={tagFormOpen}
        title={parentPickerOpen ? 'Select parent' : editingTag ? 'Edit tag' : 'New tag'}
        onClose={handleModalClose}
        maxHeightFraction={0.9}
      >
        <BottomSheetScroll maxHeightFraction={0.75}>
          {parentPickerOpen ? (
            <div className="space-y-2 pb-2">
              <button
                type="button"
                onClick={() => setParentPickerOpen(false)}
                className="mb-1 flex items-center text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                <span className="mr-1">‹</span> Back to tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setParentId(null);
                  setParentPickerOpen(false);
                }}
                className="w-full rounded-xl px-4 py-3 text-left"
                style={{
                  backgroundColor: parentId === null ? colors.selectedBgSolid : colors.secondaryBgSolid,
                  color: colors.text,
                }}
              >
                None (top level)
              </button>
              {parentOptions.map((item) => (
                <button
                  key={item.tag.id}
                  type="button"
                  onClick={() => {
                    setParentId(item.tag.id);
                    setParentPickerOpen(false);
                  }}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{
                    marginLeft: item.depth * 12,
                    backgroundColor:
                      parentId === item.tag.id ? colors.selectedBgSolid : colors.secondaryBgSolid,
                    color: colors.text,
                  }}
                >
                  {formatTagName(item.path)}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pb-2">
              <div>
                <p className="mb-2 text-sm" style={{ color: colors.textMuted }}>
                  Name
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="work"
                  className="w-full rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </div>
              <div>
                <p className="mb-2 text-sm" style={{ color: colors.textMuted }}>
                  Parent tag
                </p>
                <button
                  type="button"
                  onClick={() => setParentPickerOpen(true)}
                  className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                >
                  <span>{selectedParentLabel}</span>
                  <span style={{ color: colors.textMuted }}>▾</span>
                </button>
              </div>
              <div>
                <p className="mb-2 text-sm" style={{ color: colors.textMuted }}>
                  Color
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TAG_COLOR_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setColor(item)}
                      className={`h-10 w-10 shrink-0 rounded-full border-2 ${color === item ? 'border-stone-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: item }}
                    />
                  ))}
                </div>
              </div>
              {error ? <p className="text-sm text-rose-500">{error}</p> : null}
              <ActionButton
                label={editingTag ? 'Update' : 'Add tag'}
                type="submit"
                className="w-full"
              />
            </form>
          )}
        </BottomSheetScroll>
      </BottomSheetModal>
    </div>
  );
}
