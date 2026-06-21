type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

export function subscribeDataRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyDataRefresh(): void {
  listeners.forEach((listener) => listener());
}
