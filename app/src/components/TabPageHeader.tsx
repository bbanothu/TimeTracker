import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileButton } from '@/components/ProfileButton';
import { useAppColors } from '@/hooks/useAppColors';

const TAB_TITLES: Record<string, string> = {
  index: 'Track',
  tags: 'Tags',
  map: 'Map',
  stats: 'Stats',
  goals: 'Goals',
};

interface TabPageHeaderProps {
  title?: string;
  /** Account stack screens — chevron back instead of profile avatar. */
  showBack?: boolean;
}

/** In-flow page title row (scrolls with content — not a pinned nav bar). */
export function TabPageHeader({ title, showBack = false }: TabPageHeaderProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const router = useRouter();
  const navigation = useNavigation();
  const label = title ?? TAB_TITLES[route.name] ?? '';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View
      className="mb-2 flex-row items-center pb-2"
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
      }}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="-ml-2 mr-1 items-center justify-center p-1"
        >
          <Ionicons name="chevron-back" size={28} color={colors.headerText} />
        </Pressable>
      ) : null}
      <Text
        className="flex-1 text-[28px] font-bold"
        style={{ color: colors.headerText }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {showBack ? null : <ProfileButton />}
    </View>
  );
}
