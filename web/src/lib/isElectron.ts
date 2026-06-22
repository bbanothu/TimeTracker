/** Desktop shell (preload exposes window.electron). */
export function isElectronShell(): boolean {
  return (
    import.meta.env.VITE_ELECTRON === 'true' ||
    (typeof window !== 'undefined' && window.electron?.isElectron === true)
  );
}

/** file:// builds need hash routing; http:// dev server can use browser history. */
export function useHashRouter(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}
