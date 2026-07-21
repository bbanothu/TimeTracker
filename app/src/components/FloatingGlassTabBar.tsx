import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/useAppColors';
import {
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_FLOAT_MARGIN,
  TAB_BAR_HEIGHT,
  TAB_ICON_SIZE,
  TAB_LABEL_FONT_SIZE,
} from '@/navigation/headerOptions';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'timer', inactive: 'timer-outline' },
  tags: { active: 'pricetags', inactive: 'pricetags-outline' },
  map: { active: 'map', inactive: 'map-outline' },
  stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  goals: { active: 'flag', inactive: 'flag-outline' },
};

const PILL_RADIUS = 30;

export function FloatingGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  // Float above the home indicator with a clear gap so content shows below the pill.
  const bottom = Math.max(insets.bottom, 12) + TAB_BAR_BOTTOM_GAP;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          left: TAB_BAR_FLOAT_MARGIN,
          right: TAB_BAR_FLOAT_MARGIN,
          bottom,
        },
      ]}
    >
      <View style={[styles.shadowHost, { shadowColor: '#000' }]}>
        <View
          style={[
            styles.clip,
            {
              borderColor: colors.tabBarBorder || colors.glassBorder,
              backgroundColor: Platform.OS === 'android' ? colors.surfaceSolid : 'transparent',
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <>
              <BlurView
                intensity={55}
                tint={colors.blurTint}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.tabBarBg }]} />
            </>
          ) : null}

          <View style={styles.row}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : typeof options.title === 'string'
                    ? options.title
                    : route.name;
              const focused = state.index === index;
              const color = focused ? colors.tabActive : colors.tabInactive;
              const icons = TAB_ICONS[route.name] ?? {
                active: 'ellipse',
                inactive: 'ellipse-outline',
              };

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                  style={styles.item}
                >
                  <View style={styles.itemInner}>
                    <Ionicons
                      name={focused ? icons.active : icons.inactive}
                      size={TAB_ICON_SIZE}
                      color={color}
                    />
                    <Text style={[styles.label, { color }]} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT,
    zIndex: 100,
  },
  shadowHost: {
    flex: 1,
    borderRadius: PILL_RADIUS,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
  clip: {
    flex: 1,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 2,
    minWidth: 52,
  },
  label: {
    fontSize: TAB_LABEL_FONT_SIZE,
    fontWeight: '600',
  },
});
