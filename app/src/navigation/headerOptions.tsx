import { Platform, StatusBar } from 'react-native';

import { TabHeaderBackground } from '@/components/TabHeaderBackground';
import type { AppColors } from '@/theme/colors';

const ANDROID_HEADER_BODY = 52;

export function getAppHeaderOptions(colors: AppColors) {
  const isAndroid = Platform.OS === 'android';
  const androidStatusBarHeight = StatusBar.currentHeight ?? 0;

  return {
    headerTransparent: !isAndroid,
    headerBackground: isAndroid ? undefined : () => <TabHeaderBackground />,
    headerStyle: Platform.select({
      ios: { height: 108 },
      android: {
        backgroundColor: colors.surfaceSolid,
        elevation: 0,
        height: ANDROID_HEADER_BODY + androidStatusBarHeight,
      },
      default: {},
    }),
    headerTintColor: colors.headerText,
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontSize: 22,
      color: colors.headerText,
    },
    headerShadowVisible: false,
  };
}

export function getTabBarStyle(colors: AppColors) {
  return Platform.select({
    android: {
      backgroundColor: colors.surfaceSolid,
      borderTopColor: colors.tabBarBorder,
      elevation: 8,
    },
    default: {
      backgroundColor: colors.tabBarBg,
      borderTopColor: colors.tabBarBorder,
    },
  });
}
