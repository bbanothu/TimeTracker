import { forwardRef } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

import { useTabRefresh, type CloudPullMode } from '@/hooks/useTabRefresh';

interface TabScrollViewProps extends ScrollViewProps {
  onRefreshExtra?: () => void | Promise<void>;
  /** Default `full` for main tabs. Use `none` for local-only screens like History. */
  cloudPull?: CloudPullMode;
}

export const TabScrollView = forwardRef<ScrollView, TabScrollViewProps>(function TabScrollView(
  { onRefreshExtra, cloudPull = 'full', children, ...props },
  ref,
) {
  const { refreshControlProps } = useTabRefresh(onRefreshExtra, cloudPull);

  return (
    <ScrollView ref={ref} {...props} refreshControl={<RefreshControl {...refreshControlProps} />}>
      {children}
    </ScrollView>
  );
});
