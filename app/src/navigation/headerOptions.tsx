import { HeaderBackButton } from '@react-navigation/elements';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StatusBar } from 'react-native';

import type { AppColors } from '@/theme/colors';

const ANDROID_HEADER_BODY = 52;
export const TAB_ICON_SIZE = 22;
export const TAB_LABEL_FONT_SIZE = 10;
export const TAB_EDGE_INSET = 4;
export const TAB_BAR_FLOAT_MARGIN = 20;
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_GAP = 8;
const TAB_ITEM_SPACING = 0;

export function getTabBarItemStyle() {
  return {
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginHorizontal: TAB_ITEM_SPACING,
  };
}

export function getTabBarTrackItemStyle() {
  return {
    ...getTabBarItemStyle(),
    paddingLeft: TAB_EDGE_INSET,
    marginLeft: 0,
  };
}

export function getTabBarGoalsItemStyle() {
  return {
    ...getTabBarItemStyle(),
    paddingRight: TAB_EDGE_INSET,
    marginRight: 0,
  };
}

export function getAppHeaderOptions(colors: AppColors) {
  const isAndroid = Platform.OS === 'android';
  const androidStatusBarHeight = StatusBar.currentHeight ?? 0;

  return {
    headerTransparent: true,
    headerBackground: () => null,
    headerStyle: Platform.select({
      ios: {
        backgroundColor: 'transparent',
      },
      android: {
        backgroundColor: 'transparent',
        elevation: 0,
        height: ANDROID_HEADER_BODY + androidStatusBarHeight,
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
    headerTintColor: colors.headerText,
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontSize: 28,
      color: colors.headerText,
    },
    headerShadowVisible: false,
  };
}

/** Stack screens pushed over tabs (Account, Progress, etc.). */
export function getStackScreenOptions(
  colors: AppColors,
  title: string,
): (props: {
  navigation: NativeStackNavigationProp<ParamListBase>;
}) => NativeStackNavigationOptions {
  return ({ navigation }) => ({
    headerShown: true,
    title,
    headerBackTitle: '',
    headerBackButtonDisplayMode: 'minimal',
    ...getAppHeaderOptions(colors),
    headerLeft: (props) => (
      <HeaderBackButton
        {...props}
        tintColor={colors.headerText}
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('(tabs)' as never);
        }}
      />
    ),
  });
}

export function getTabBarStyle(colors: AppColors) {
  return {
    position: 'absolute' as const,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    elevation: 0,
    // Visual chrome lives in FloatingGlassTabBar; keep shell transparent.
    height: 0,
    opacity: colors.tabBarBg ? 1 : 1,
  };
}

export function getTabBarLabelStyle() {
  return {
    fontSize: TAB_LABEL_FONT_SIZE,
    fontWeight: '600' as const,
    marginTop: 0,
  };
}

/** Extra bottom inset so scroll content clears the floating pill tab bar. */
export function getFloatingTabBarClearance(safeAreaBottom: number) {
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + Math.max(safeAreaBottom, 8) + 8;
}
