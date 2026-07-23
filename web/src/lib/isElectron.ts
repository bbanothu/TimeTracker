/** file:// builds need hash routing; http:// dev server can use browser history. */
export function useHashRouter(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}
