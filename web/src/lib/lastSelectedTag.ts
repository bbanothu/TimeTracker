const STORAGE_KEY = 'irlday-last-selected-tag';

export async function getLastSelectedTagId(): Promise<string | null> {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setLastSelectedTagId(tagId: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, tagId);
  } catch {
    // ignore persistence errors
  }
}
