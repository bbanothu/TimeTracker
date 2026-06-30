import { useRef, useState } from 'react';

import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useProfilePhoto } from '@/contexts/ProfilePhotoContext';
import { useAppColors } from '@/contexts/ThemeContext';

interface ProfileAvatarProps {
  fallbackLabel: string;
  compact?: boolean;
  size?: number;
  editable?: boolean;
}

export function ProfileAvatar({
  fallbackLabel,
  compact = false,
  size: sizeProp,
  editable = true,
}: ProfileAvatarProps) {
  const colors = useAppColors();
  const { photoUrl, uploadPhoto } = useProfilePhoto();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const size = sizeProp ?? (compact ? 52 : 80);
  const initialClass = size <= 36 ? 'text-xs' : compact ? 'text-sm' : 'text-xl';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setUploading(true);
      await uploadPhoto(file);
    } catch (error) {
      console.error('Profile photo upload failed:', error);
      window.alert(error instanceof Error ? error.message : 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative shrink-0 ${compact || sizeProp != null ? '' : 'mb-3'}`}>
      <div
        className="flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: size, height: size, backgroundColor: colors.selectedBg }}
      >
        {uploading ? (
          <LoadingIndicator size={Math.round(size * 0.45)} />
        ) : photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className={`font-bold ${initialClass}`} style={{ color: colors.selectedText }}>
            {fallbackLabel}
          </span>
        )}
      </div>

      {editable ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            aria-label="Change profile photo"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute flex items-center justify-center rounded-full border-2 text-sm font-bold leading-none"
            style={{
              width: compact ? 22 : 28,
              height: compact ? 22 : 28,
              bottom: compact ? -2 : -4,
              right: compact ? -2 : -4,
              backgroundColor: colors.primary,
              borderColor: colors.surfaceSolid,
              color: colors.textOnPrimary,
            }}
          >
            +
          </button>
        </>
      ) : null}
    </div>
  );
}
