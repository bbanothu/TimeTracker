import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { TAG_COLOR_OPTIONS } from '@/theme/colors';
import { useAppColors } from '@/contexts/ThemeContext';
import type { Tag } from '@/types';
import { formatTagName } from '@/utils/formatDuration';
import type { FlatTagItem } from '@/utils/tagTree';

interface TagFormContentProps {
  editingTag: Tag | null;
  name: string;
  onNameChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  parentId: string | null;
  onParentIdChange: (value: string | null) => void;
  parentPickerOpen: boolean;
  onParentPickerOpenChange: (open: boolean) => void;
  parentOptions: FlatTagItem[];
  showDescription: boolean;
  onShowDescriptionChange: (show: boolean) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  error: string | null;
  onSubmit: (event: FormEvent) => void;
}

export function TagFormContent({
  editingTag,
  name,
  onNameChange,
  color,
  onColorChange,
  parentId,
  onParentIdChange,
  parentPickerOpen,
  onParentPickerOpenChange,
  parentOptions,
  showDescription,
  onShowDescriptionChange,
  description,
  onDescriptionChange,
  error,
  onSubmit,
}: TagFormContentProps) {
  const colors = useAppColors();

  const selectedParentLabel =
    parentId === null
      ? 'None (top level)'
      : formatTagName(parentOptions.find((item) => item.tag.id === parentId)?.path ?? 'Unknown');

  if (parentPickerOpen) {
    return (
      <div className="space-y-2 pb-2">
        <button
          type="button"
          onClick={() => onParentPickerOpenChange(false)}
          className="mb-1 flex items-center text-base font-semibold"
          style={{ color: colors.primary }}
        >
          <span className="mr-1">‹</span> Back to tag
        </button>
        <button
          type="button"
          onClick={() => {
            onParentIdChange(null);
            onParentPickerOpenChange(false);
          }}
          className="w-full rounded-xl px-4 py-3.5 text-left text-lg"
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
              onParentIdChange(item.tag.id);
              onParentPickerOpenChange(false);
            }}
            className="w-full rounded-xl px-4 py-3.5 text-left text-lg"
            style={{
              marginLeft: item.depth * 14,
              backgroundColor:
                parentId === item.tag.id ? colors.selectedBgSolid : colors.secondaryBgSolid,
              color: colors.text,
            }}
          >
            {formatTagName(item.path)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 pb-2">
      <div>
        <p className="mb-2 text-base" style={{ color: colors.textMuted }}>
          Name
        </p>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="work"
          className="w-full rounded-xl border px-4 py-3.5 text-lg"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
        />
      </div>
      <div>
        <p className="mb-2 text-base" style={{ color: colors.textMuted }}>
          Parent tag
        </p>
        <button
          type="button"
          onClick={() => onParentPickerOpenChange(true)}
          className="flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-lg"
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
        <p className="mb-2 text-base" style={{ color: colors.textMuted }}>
          Color
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {TAG_COLOR_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onColorChange(item)}
              className={`h-12 w-12 shrink-0 rounded-full border-2 ${color === item ? 'border-stone-900 dark:border-white' : 'border-transparent'}`}
              style={{ backgroundColor: item }}
            />
          ))}
        </div>
      </div>
      {showDescription ? (
        <div>
          <p className="mb-2 text-base" style={{ color: colors.textMuted }}>
            Description
          </p>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Notes about when or how to use this tag"
            rows={4}
            className="w-full rounded-xl border px-4 py-3.5 text-lg"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onShowDescriptionChange(true)}
          className="flex items-center text-base font-semibold"
          style={{ color: colors.primary }}
        >
          <span className="mr-1 text-lg leading-none">+</span> Add description
        </button>
      )}
      {error ? <p className="text-base text-rose-500">{error}</p> : null}
      <ActionButton
        label={editingTag ? 'Update' : 'Add tag'}
        type="submit"
        className="w-full py-3.5 text-base"
      />
    </form>
  );
}
