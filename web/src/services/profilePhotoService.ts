import { supabase } from '@/lib/supabase';

const PROFILE_BUCKET = 'Profile';
const photoObjectUrls = new Map<string, string>();

function storagePath(userId: string): string {
  return `${userId}.jpg`;
}

function revokeCachedUrl(userId: string): void {
  const existing = photoObjectUrls.get(userId);
  if (existing) {
    URL.revokeObjectURL(existing);
    photoObjectUrls.delete(userId);
  }
}

export async function fetchProfilePhotoUrl(userId: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PROFILE_BUCKET).download(storagePath(userId));

  if (error) {
    return null;
  }

  revokeCachedUrl(userId);
  const url = URL.createObjectURL(data);
  photoObjectUrls.set(userId, url);
  return url;
}

export async function uploadProfilePhoto(userId: string, file: File | Blob): Promise<void> {
  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(storagePath(userId), file, {
    contentType: file instanceof File ? file.type || 'image/jpeg' : 'image/jpeg',
    upsert: true,
  });

  if (error) throw error;
}

export function clearProfilePhotoCache(userId?: string): void {
  if (userId) {
    revokeCachedUrl(userId);
    return;
  }
  for (const id of photoObjectUrls.keys()) {
    revokeCachedUrl(id);
  }
}
