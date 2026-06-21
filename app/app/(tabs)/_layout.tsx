import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { ProfileButton } from '@/components/ProfileButton';
import { TabHeaderBackground } from '@/components/TabHeaderBackground';
import { TimerProvider } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { TagsProvider } from '@/hooks/useTags';

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

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerBackground: () => <TabHeaderBackground />,
        headerStyle: Platform.select({
          ios: { height: 108 },
          android: { height: 72 },
          default: { height: 72 },
        }) as { backgroundColor?: string },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
          color: colors.headerText,
        },
        headerShadowVisible: false,
        headerTintColor: colors.headerText,
        headerRight: () => <ProfileButton />,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
        },
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
