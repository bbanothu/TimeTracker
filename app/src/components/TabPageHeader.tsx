import { useRoute } from '@react-navigation/native';
import { Text, View } from 'react-native';
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
}

/** In-flow page title row (scrolls with content — not a pinned nav bar). */
export function TabPageHeader({ title }: TabPageHeaderProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const label = title ?? TAB_TITLES[route.name] ?? '';

  return (
    <View
      className="mb-2 flex-row items-center pb-2"
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
      }}
    >
      <Text
        className="flex-1 text-[28px] font-bold"
        style={{ color: colors.headerText }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ProfileButton />
    </View>
  );
}
