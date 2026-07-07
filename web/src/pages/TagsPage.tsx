import { FormEvent, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { BottomSheetModal, BottomSheetScroll } from '@/components/ui/BottomSheetModal';
import { TagFormContent } from '@/components/ui/TagFormContent';
import { TagsList } from '@/components/ui/TagsList';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoading } from '@/components/ui/PageLoading';
import { GOOGLE_EVENT_COLORS } from '@/constants/googleCalendarColors';
import { filterDisplayTags } from '@/constants/defaultPlace';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFlatTagsByUsage } from '@/hooks/useFlatTagsByUsage';
import type { Tag } from '@/types';
import { getEligibleParents, wouldCreateCycle } from '@/utils/tagTree';

export function TagsPage() {
  const colors = useAppColors();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { tags, loading, addTag, editTag, removeTag, toggleTagAnalytics } = useTags();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(GOOGLE_EVENT_COLORS[0].hex);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTags = useMemo(() => filterDisplayTags(tags), [tags]);
  const flatTags = useFlatTagsByUsage(displayTags);
  const parentOptions = useMemo(
    () => getEligibleParents(editingTag?.id ?? null, displayTags),
    [editingTag, displayTags],
  );

  const formTitle = parentPickerOpen ? 'Select parent' : editingTag ? 'Edit tag' : 'New tag';

  const resetForm = () => {
    setName('');
    setColor(GOOGLE_EVENT_COLORS[0].hex);
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
      if (editingTag) await editTag(editingTag.id, name, color, parentId, description);
      else await addTag(name, color, parentId, description);
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

  const handleDelete = async (tag: Tag) => {
    try {
      setError(null);
      await removeTag(tag.id);
      if (editingTag?.id === tag.id) closeTagForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete tag');
    }
  };

  const formContent = (
    <TagFormContent
      editingTag={editingTag}
      name={name}
      onNameChange={setName}
      color={color}
      onColorChange={setColor}
      parentId={parentId}
      onParentIdChange={setParentId}
      parentPickerOpen={parentPickerOpen}
      onParentPickerOpenChange={setParentPickerOpen}
      parentOptions={parentOptions}
      showDescription={showDescription}
      onShowDescriptionChange={setShowDescription}
      description={description}
      onDescriptionChange={setDescription}
      error={error}
      onSubmit={handleSubmit}
    />
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <PageHeader title="Tags" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start lg:gap-6">
        <div>
          <ActionButton
            label="Create new tag"
            type="button"
            variant="secondary"
            onClick={openCreateForm}
            className="mb-4 w-full py-3.5 text-base lg:max-w-xs"
          />

          <p className="mb-2 text-base font-medium" style={{ color: colors.textMuted }}>
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
        </div>

        <ThemedSurface className="sticky top-8 hidden p-5 lg:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              {tagFormOpen ? formTitle : 'Tag details'}
            </h2>
            {tagFormOpen ? (
              <button
                type="button"
                onClick={closeTagForm}
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Cancel
              </button>
            ) : null}
          </div>
          {tagFormOpen ? (
            formContent
          ) : (
            <p className="text-sm leading-6" style={{ color: colors.textMuted }}>
              Select a tag from the list to edit it, or create a new tag. Descriptions and parent
              tags help organize your tracking on larger screens.
            </p>
          )}
        </ThemedSurface>
      </div>

      {!isDesktop ? (
        <BottomSheetModal
          visible={tagFormOpen}
          title={formTitle}
          onClose={handleModalClose}
          maxHeightFraction={0.9}
        >
          <BottomSheetScroll maxHeightFraction={0.75}>{formContent}</BottomSheetScroll>
        </BottomSheetModal>
      ) : null}
    </div>
  );
}
