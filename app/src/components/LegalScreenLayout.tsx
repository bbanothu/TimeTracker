import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';

interface LegalScreenLayoutProps {
  updated?: string;
  children: ReactNode;
}

export function LegalScreenLayout({ updated, children }: LegalScreenLayoutProps) {
  const colors = useAppColors();

  return (
    <AppBackground>
      <ScrollView className="flex-1 px-4 pb-8" contentContainerClassName="pt-2">
        <ThemedSurface className="p-4">
          {updated ? (
            <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
              Last updated: {updated}
            </Text>
          ) : null}
          <View className="gap-5">{children}</View>
        </ThemedSurface>
      </ScrollView>
    </AppBackground>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  const colors = useAppColors();

  return (
    <View>
      <Text className="mb-2 text-base font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  const colors = useAppColors();

  return (
    <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
      {children}
    </Text>
  );
}

export function LegalBulletList({ items }: { items: string[] }) {
  const colors = useAppColors();

  return (
    <View className="gap-1 pl-1">
      {items.map((item) => (
        <View key={item} className="flex-row gap-2">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            •
          </Text>
          <Text className="flex-1 text-sm leading-6" style={{ color: colors.textSecondary }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LegalLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Text
      className="text-sm font-medium leading-6"
      style={{ color: colors.primary }}
      onPress={onPress}
    >
      {label}
    </Text>
  );
}
