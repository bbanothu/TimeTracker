import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

import { useTabRefresh } from '@/hooks/useTabRefresh';

interface TabScrollViewProps extends ScrollViewProps {
  onRefreshExtra?: () => void | Promise<void>;
}

export function TabScrollView({ onRefreshExtra, children, ...props }: TabScrollViewProps) {
  const { refreshControlProps } = useTabRefresh(onRefreshExtra);

  return (
    <ScrollView {...props} refreshControl={<RefreshControl {...refreshControlProps} />}>
      {children}
    </ScrollView>
  );
}
