export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationLong(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTagName(name: string): string {
  const stripped = name.replace(/^#+/, '').trim();
  if (!stripped) return stripped;

  const spaceIndex = stripped.search(/\s/);
  if (spaceIndex === -1) {
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  const firstWord = stripped.slice(0, spaceIndex);
  const rest = stripped.slice(spaceIndex);
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + rest;
}
