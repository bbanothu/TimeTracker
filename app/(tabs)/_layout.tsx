import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { ProfileButton } from '@/components/ProfileButton';
import { TimerProvider } from '@/hooks/useActiveSession';
import { TagsProvider } from '@/hooks/useTags';
import { useTheme } from '@/hooks/useTheme';

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
  const { isDark } = useTheme();
  const headerBackground = isDark ? '#0F172A' : '#FFFFFF';
  const headerForeground = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: headerBackground,
          height: Platform.select({ ios: 108, android: 72, default: 72 }),
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
          color: headerForeground,
        },
        headerShadowVisible: false,
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
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
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <TimerProvider>
      <TagsProvider>
        <TabsNavigator />
      </TagsProvider>
    </TimerProvider>
  );
}
