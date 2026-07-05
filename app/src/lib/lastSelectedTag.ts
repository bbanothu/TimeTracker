import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'irlday-last-selected-tag';

export async function getLastSelectedTagId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setLastSelectedTagId(tagId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, tagId);
  } catch {
    // ignore persistence errors
  }
}
