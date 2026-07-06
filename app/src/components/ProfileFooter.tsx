import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

const FOOTER_LINKS = [
  { href: '/about' as const, label: 'About' },
  { href: '/contact' as const, label: 'Contact' },
  { href: '/privacy' as const, label: 'Privacy' },
  { href: '/terms' as const, label: 'Terms' },
];

export function ProfileFooter() {
  const colors = useAppColors();
  const router = useRouter();

  return (
    <View
      className="mt-8 border-t pt-6"
      style={{ borderColor: colors.surfaceBorder }}
    >
      <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
        © {new Date().getFullYear()} QCSmallBusiness. All rights reserved.
      </Text>
      <View className="flex-row flex-wrap gap-x-6 gap-y-2">
        {FOOTER_LINKS.map(({ href, label }) => (
          <Pressable
            key={href}
            onPress={() => router.push(href)}
            accessibilityRole="link"
          >
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
