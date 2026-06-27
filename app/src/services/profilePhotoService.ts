import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const AVATAR_DIR = `${FileSystem.documentDirectory}avatars/`;
const PROFILE_BUCKET = 'Profile';

function avatarPath(userId: string): string {
  return `${AVATAR_DIR}${userId}.jpg`;
}

function storagePath(userId: string): string {
  return `${userId}.jpg`;
}

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (state.isConnected !== true) return false;
  if (Platform.OS === 'android') return true;
  return state.isInternetReachable !== false;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read photo'));
    reader.readAsDataURL(blob);
  });
}

export async function getProfilePhotoUri(userId: string): Promise<string | null> {
  const path = avatarPath(userId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function saveProfilePhoto(userId: string, sourceUri: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  const destination = avatarPath(userId);
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function removeProfilePhoto(userId: string): Promise<void> {
  const path = avatarPath(userId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

export async function uploadProfilePhotoToCloud(userId: string, localUri: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await isOnline())) return;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(storagePath(userId), arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;
}

export async function syncProfilePhotoFromCloud(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !(await isOnline())) {
    return getProfilePhotoUri(userId);
  }

  const { data, error } = await supabase.storage.from(PROFILE_BUCKET).download(storagePath(userId));

  if (error) {
    return getProfilePhotoUri(userId);
  }

  await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  const localPath = avatarPath(userId);
  const base64 = await blobToBase64(data);
  await FileSystem.writeAsStringAsync(localPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return localPath;
}

export async function saveAndSyncProfilePhoto(userId: string, sourceUri: string): Promise<string> {
  const localUri = await saveProfilePhoto(userId, sourceUri);
  try {
    await uploadProfilePhotoToCloud(userId, localUri);
  } catch (error) {
    console.warn('Profile photo cloud upload failed:', error);
  }
  return localUri;
}
