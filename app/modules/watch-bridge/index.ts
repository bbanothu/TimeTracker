import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type WatchRequestListener = (request: WatchRequest) => void;

type WatchBridgeNativeModule = {
  setState(state: Record<string, unknown>): void;
  isSupported(): boolean;
  isReachable(): boolean;
  isWatchAppInstalled(): boolean;
  activationState(): number;
  addListener(eventName: 'onWatchRequest', listener: WatchRequestListener): { remove(): void };
};

export type WatchRequest = {
  action?: string;
  tagId?: string;
  sessionId?: string;
  durationMinutes?: number;
};

let cached: WatchBridgeNativeModule | null | undefined;

function getNative(): WatchBridgeNativeModule | null {
  if (Platform.OS !== 'ios') return null;
  if (cached !== undefined) return cached;
  cached = requireOptionalNativeModule<WatchBridgeNativeModule>('WatchBridge');
  if (!cached) {
    console.warn(
      '[WatchBridge] native module missing — rebuild the iOS app from Xcode (not Expo Go)',
    );
  } else {
    console.log(
      '[WatchBridge] loaded supported=',
      cached.isSupported(),
      'activation=',
      cached.activationState(),
      'watchInstalled=',
      cached.isWatchAppInstalled(),
      'reachable=',
      cached.isReachable(),
    );
  }
  return cached;
}

export function isWatchBridgeSupported(): boolean {
  const native = getNative();
  if (!native) return false;
  try {
    return native.isSupported();
  } catch {
    return false;
  }
}

export function setWatchState(state: Record<string, unknown>): void {
  const native = getNative();
  if (!native) return;
  try {
    native.setState(state);
  } catch (error) {
    console.warn('[WatchBridge] setState failed', error);
  }
}

export function addWatchRequestListener(listener: WatchRequestListener): { remove(): void } | null {
  const native = getNative();
  if (!native?.addListener) return null;
  return native.addListener('onWatchRequest', listener);
}
