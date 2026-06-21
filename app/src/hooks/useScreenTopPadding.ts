import { useHeaderHeight } from '@react-navigation/elements';
import { Platform } from 'react-native';

/** iOS headers are transparent; Android headers are opaque and already offset content. */
export function useScreenTopPadding(extra = 0): number {
  const headerHeight = useHeaderHeight();

  if (Platform.OS === 'android') {
    return extra;
  }

  return headerHeight + extra;
}
