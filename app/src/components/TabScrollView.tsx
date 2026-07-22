import { forwardRef } from 'react';
import { RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabPageHeader } from '@/components/TabPageHeader';
import { useTabRefresh, type CloudPullMode } from '@/hooks/useTabRefresh';
import { getFloatingTabBarClearance } from '@/navigation/headerOptions';

interface TabScrollViewProps extends ScrollViewProps {
  onRefreshExtra?: () => void | Promise<void>;
  /** Default `full` for main tabs. Use `none` for local-only screens like History. */
  cloudPull?: CloudPullMode;
  /** In-flow title + profile (scrolls with page). Default true. */
  pageHeader?: boolean;
  pageTitle?: string;
  /** Use the Account-stack header (back chevron, no profile avatar). */
  showBack?: boolean;
  /** Horizontal content inset under the page header. Default matches pageHeader. */
  contentPad?: boolean;
}

export const TabScrollView = forwardRef<ScrollView, TabScrollViewProps>(function TabScrollView(
  {
    onRefreshExtra,
    cloudPull = 'full',
    pageHeader = true,
    pageTitle,
    showBack = false,
    contentPad,
    children,
    contentContainerStyle,
    ...props
  },
  ref,
) {
  const { refreshControlProps } = useTabRefresh(onRefreshExtra, cloudPull);
  const insets = useSafeAreaInsets();
  const bottomClearance = getFloatingTabBarClearance(insets.bottom);
  const padContent = contentPad ?? pageHeader;

  return (
    <ScrollView
      ref={ref}
      {...props}
      contentContainerStyle={[{ paddingBottom: bottomClearance }, contentContainerStyle]}
      refreshControl={<RefreshControl {...refreshControlProps} />}
    >
      {pageHeader ? <TabPageHeader title={pageTitle} showBack={showBack} /> : null}
      {padContent ? <View style={{ paddingHorizontal: 16 }}>{children}</View> : children}
    </ScrollView>
  );
});
