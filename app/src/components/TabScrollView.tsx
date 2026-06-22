import { forwardRef } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

import { useTabRefresh } from '@/hooks/useTabRefresh';

interface TabScrollViewProps extends ScrollViewProps {
  onRefreshExtra?: () => void | Promise<void>;
}

export const TabScrollView = forwardRef<ScrollView, TabScrollViewProps>(function TabScrollView(
  { onRefreshExtra, children, ...props },
  ref,
) {
  const { refreshControlProps } = useTabRefresh(onRefreshExtra);

  return (
    <ScrollView ref={ref} {...props} refreshControl={<RefreshControl {...refreshControlProps} />}>
      {children}
    </ScrollView>
  );
});
