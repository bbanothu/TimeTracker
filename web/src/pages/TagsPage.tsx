import { FormEvent, useMemo, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { TagsList } from '@/components/ui/TagsList';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { TAG_COLOR_OPTIONS } from '@/theme/colors';
import { useAppColors } from '@/contexts/ThemeContext';
import { useTags } from '@/contexts/TagsContext';
import type { Tag } from '@/types';
import { flattenTags, getEligibleParents, wouldCreateCycle } from '@/utils/tagTree';

export function TagsPage() {
  const colors = useAppColors();
  const { tags, loading, addTag, editTag, removeTag } = useTags();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flatTags = useMemo(() => flattenTags(tags), [tags]);
  const parentOptions = useMemo(
    () => getEligibleParents(editingTag?.id ?? null, tags),
    [editingTag, tags],
  );

  const resetForm = () => {
    setName('');
    setColor(TAG_COLOR_OPTIONS[0]);
    setParentId(null);
    setEditingTag(null);
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
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setParentId(tag.parentId);
  };

  const handleDelete = async (tag: Tag) => {
    try {
      setError(null);
      await removeTag(tag.id);
      if (editingTag?.id === tag.id) resetForm();
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

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
          {editingTag ? 'Edit tag' : 'New tag'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="work"
            className="w-full rounded-xl border px-4 py-3"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
          />
          <select
            value={parentId ?? ''}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full rounded-xl border px-4 py-3"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }}
          >
            <option value="">None (top level)</option>
            {parentOptions.map((item) => (
              <option key={item.tag.id} value={item.tag.id}>
                {item.path}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {TAG_COLOR_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setColor(item)}
                className={`h-10 w-10 rounded-full border-2 ${color === item ? 'border-stone-900 dark:border-white' : 'border-transparent'}`}
                style={{ backgroundColor: item }}
              />
            ))}
          </div>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <div className="flex gap-3">
            <ActionButton label={editingTag ? 'Update' : 'Add tag'} type="submit" className="flex-1" />
            {editingTag ? (
              <ActionButton label="Cancel" type="button" variant="secondary" onClick={resetForm} />
            ) : null}
          </div>
        </form>
      </ThemedSurface>

      <p className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Tags ({flatTags.length})
      </p>
      <TagsList items={flatTags} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
