import { useHeaderHeight } from '@react-navigation/elements';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** iOS headers are transparent; Android headers are opaque and already offset content. */
export function useScreenTopPadding(extra = 0): number {
  const headerHeight = useHeaderHeight();

  if (Platform.OS === 'android') {
    return extra;
  }

  return headerHeight + extra;
}

/** Top/bottom padding for stack screens with a ScrollView. */
export function useScreenScrollPadding(options?: { topExtra?: number; bottomExtra?: number }) {
  const topExtra = options?.topExtra ?? 0;
  const bottomExtra = options?.bottomExtra ?? 32;
  const paddingTop = useScreenTopPadding(topExtra);
  const { bottom } = useSafeAreaInsets();
  const paddingBottom = bottom + bottomExtra;

  return { paddingTop, paddingBottom };
}
