import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { AppBackground } from '@/components/AppBackground';
import { FloatingGlassTabBar } from '@/components/FloatingGlassTabBar';
import { useAppColors } from '@/hooks/useAppColors';
import { TAB_ICON_SIZE } from '@/navigation/headerOptions';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  focused,
  color,
  active,
  inactive,
}: {
  focused: boolean;
  color: string;
  size: number;
  active: IoniconName;
  inactive: IoniconName;
}) {
  return <Ionicons name={focused ? active : inactive} size={TAB_ICON_SIZE} color={color} />;
}

function TabsNavigator() {
  const colors = useAppColors();

  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Track',
          tabBarLabel: 'Track',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="timer"
              inactive="timer-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarLabel: 'Tags',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="pricetags"
              inactive="pricetags-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="map"
              inactive="map-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="stats-chart"
              inactive="stats-chart-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="flag"
              inactive="flag-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AppBackground>
      <TabsNavigator />
    </AppBackground>
  );
}
