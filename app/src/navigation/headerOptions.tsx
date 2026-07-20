import { HeaderBackButton } from '@react-navigation/elements';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StatusBar } from 'react-native';

import { TabHeaderBackground } from '@/components/TabHeaderBackground';
import type { AppColors } from '@/theme/colors';

const ANDROID_HEADER_BODY = 52;
export const TAB_ICON_SIZE = 30;
export const TAB_LABEL_FONT_SIZE = 14;
export const TAB_EDGE_INSET = 12;
const TAB_ITEM_SPACING = -8;

export function getTabBarItemStyle() {
  return {
    paddingVertical: 4,
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
      fontSize: 24,
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
  return Platform.select({
    android: {
      backgroundColor: colors.surfaceSolid,
      borderTopColor: colors.tabBarBorder,
      elevation: 8,
      minHeight: 72,
      paddingTop: 6,
      paddingBottom: 10,
      paddingHorizontal: 0,
    },
    default: {
      backgroundColor: colors.tabBarBg,
      borderTopColor: colors.tabBarBorder,
      paddingTop: 8,
      paddingHorizontal: 0,
    },
  });
}

export function getTabBarLabelStyle() {
  return {
    fontSize: TAB_LABEL_FONT_SIZE,
    fontWeight: '600' as const,
    marginTop: 2,
  };
}
