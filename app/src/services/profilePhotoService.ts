import * as FileSystem from 'expo-file-system/legacy';

const AVATAR_DIR = `${FileSystem.documentDirectory}avatars/`;

function avatarPath(userId: string): string {
  return `${AVATAR_DIR}${userId}.jpg`;
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
