import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { AppBackground } from '@/components/AppBackground';
import { ProfileButton } from '@/components/ProfileButton';
import { TimerProvider } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { TagsProvider } from '@/hooks/useTags';
import { getAppHeaderOptions, getTabBarStyle } from '@/navigation/headerOptions';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  focused,
  color,
  size,
  active,
  inactive,
}: {
  focused: boolean;
  color: string;
  size: number;
  active: IoniconName;
  inactive: IoniconName;
}) {
  return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
}

function TabsNavigator() {
  const colors = useAppColors();
  const headerOptions = getAppHeaderOptions(colors);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        ...headerOptions,
        headerRight: () => <ProfileButton />,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: getTabBarStyle(colors),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Track',
          tabBarLabel: 'Track',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} color={color} size={size} active="timer" inactive="timer-outline" />
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
            <TabIcon focused={focused} color={color} size={size} active="map" inactive="map-outline" />
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
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="list"
              inactive="list-outline"
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
      <TimerProvider>
        <TagsProvider>
          <TabsNavigator />
        </TagsProvider>
      </TimerProvider>
    </AppBackground>
  );
}
