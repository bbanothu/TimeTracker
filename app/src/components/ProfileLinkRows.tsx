import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileLinkIcon = 'friends' | 'history' | 'password';

export interface ProfileLinkRow {
  id: string;
  label: string;
  onPress: () => void;
  badge?: number;
  icon?: ProfileLinkIcon;
}

const ICONS: Record<ProfileLinkIcon, IoniconName> = {
  friends: 'people-outline',
  history: 'time-outline',
  password: 'lock-closed-outline',
};

interface ProfileLinkRowsProps {
  rows: ProfileLinkRow[];
}

export function ProfileLinkRows({ rows }: ProfileLinkRowsProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {rows.map((row, index) => (
        <Pressable
          key={row.id}
          onPress={row.onPress}
          className="flex-row items-center justify-between px-4 py-3.5"
          style={{
            borderBottomWidth: index < rows.length - 1 ? 1 : 0,
            borderBottomColor: colors.glassBorder,
          }}
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            {row.icon ? (
              <Ionicons name={ICONS[row.icon]} size={18} color={colors.textMuted} />
            ) : null}
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              {row.label}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {row.badge && row.badge > 0 ? (
              <View
                className="min-w-[1.25rem] rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: colors.primaryBright }}
              >
                <Text className="text-center text-xs font-bold text-white">{row.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Pressable>
      ))}
    </ThemedSurface>
  );
}
